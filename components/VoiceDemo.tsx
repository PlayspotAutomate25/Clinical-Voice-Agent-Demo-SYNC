import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { MicOff, Activity, Phone, PhoneOff } from 'lucide-react';
import { AGENTS } from '../constants';
import { AgentType } from '../types';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from '../services/audioUtils';

interface VoiceDemoProps {
  selectedAgent: AgentType;
}

// Tool definition for the Front Desk agent
const checkScheduleTool: FunctionDeclaration = {
  name: 'checkSchedule',
  description: 'Checks appointment availability and books if free. Call this ONLY after collecting name, phone, email, date, time, and request details.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "Customer's full name" },
      phone: { type: Type.STRING, description: "Customer's phone number" },
      email: { type: Type.STRING, description: "Customer's email address" },
      date: { type: Type.STRING, description: "Requested date" },
      time: { type: Type.STRING, description: "Requested time window" },
      request: { type: Type.STRING, description: "Short description of the issue/reason for visit" }
    },
    required: ['name', 'phone', 'email', 'date', 'time', 'request']
  }
};

const VoiceDemo: React.FC<VoiceDemoProps> = ({ selectedAgent }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isTalking, setIsTalking] = useState(false); // Model is talking
  const [audioVolume, setAudioVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Refs for audio context and processing
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const agent = AGENTS[selectedAgent];

  // Cleanup function to stop everything
  const stopSession = () => {
    // Close live session
    if (sessionRef.current) {
       sessionRef.current = null;
    }

    // Stop microphone stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Disconnect audio nodes
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }

    // Close audio contexts
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (audioContextRef.current) {
      // Stop all currently playing sources
      sourcesRef.current.forEach(source => source.stop());
      sourcesRef.current.clear();
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsConnected(false);
    setIsTalking(false);
    setAudioVolume(0);
    nextStartTimeRef.current = 0;
  };

  // Start the session
  const startSession = async () => {
    setError(null);
    try {
      if (!process.env.API_KEY) {
        throw new Error("API Key is missing. Please check your configuration.");
      }

      // 1. Setup Audio Output Context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      nextStartTimeRef.current = audioContextRef.current.currentTime;
      
      // 2. Setup Audio Input Context & Microphone
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: {
        channelCount: 1,
        sampleRate: 16000,
      }});
      streamRef.current = stream;

      // 3. Initialize Gemini Client
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Configure tools if it's the Front Desk agent
      const tools = agent.id === AgentType.FRONT_DESK ? [{ functionDeclarations: [checkScheduleTool] }] : undefined;

      // 4. Connect to Live API
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: agent.voiceName } },
          },
          systemInstruction: agent.systemInstruction,
          tools: tools,
        },
        callbacks: {
          onopen: () => {
            console.log("Gemini Live Session Opened");
            setIsConnected(true);

            // Start processing microphone audio
            if (!inputAudioContextRef.current || !streamRef.current) return;
            
            const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
            sourceNodeRef.current = source;
            
            const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              // Calculate volume for visualizer
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
              const rms = Math.sqrt(sum / inputData.length);
              setAudioVolume(Math.min(rms * 5, 1)); // Amplify for visual

              // Create and send blob
              const pcmBlob = createPcmBlob(inputData);
              sessionPromise.then(session => {
                  session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(processor);
            processor.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Tool Calls (Function Calling)
            if (message.toolCall) {
              const responses = [];
              for (const call of message.toolCall.functionCalls) {
                if (call.name === 'checkSchedule') {
                  console.log("Executing checkSchedule with:", call.args);
                  try {
                    // Send request to n8n webhook
                    const response = await fetch('https://n8n.playspotmedia.com/webhook/clinical', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(call.args)
                    });
                    
                    // The webhook returns { "status": "..." }
                    const data = await response.json();
                    
                    responses.push({
                      id: call.id,
                      name: call.name,
                      response: { result: data.status || "Appointment request received." }
                    });
                  } catch (err) {
                    console.error("Webhook error:", err);
                    responses.push({
                      id: call.id,
                      name: call.name,
                      response: { result: "I apologize, but I am currently unable to access the scheduling system. Please try again later." }
                    });
                  }
                }
              }
              
              // Send the tool response back to the model
              if (responses.length > 0) {
                 sessionPromise.then(session => {
                    session.sendToolResponse({ functionResponses: responses });
                 });
              }
            }

            // Handle Audio Output from Model
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
              setIsTalking(true);
              const ctx = audioContextRef.current;
              
              // Ensure we schedule ahead to prevent gaps, but not too far
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);

              const audioBytes = base64ToUint8Array(base64Audio);
              const audioBuffer = await decodeAudioData(audioBytes, ctx);
              
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              
              sourcesRef.current.add(source);
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) {
                   setIsTalking(false);
                }
              };
            }

            // Handle Interruptions
            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
              console.log("Model interrupted user");
              sourcesRef.current.forEach(source => source.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsTalking(false);
            }
          },
          onclose: () => {
            console.log("Session Closed");
            stopSession();
          },
          onerror: (err) => {
            console.error("Session Error", err);
            setError("Connection error. Please try again.");
            stopSession();
          }
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to start audio session.");
      stopSession();
    }
  };

  // Stop session when agent changes or component unmounts
  useEffect(() => {
    return () => {
      stopSession();
    };
  }, [selectedAgent]);

  const toggleConnection = () => {
    if (isConnected) {
      stopSession();
    } else {
      startSession();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col md:flex-row h-full min-h-[400px]">
      {/* Left Panel: Agent Info */}
      <div className="p-8 md:w-1/2 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-100 bg-gradient-to-br from-slate-50 to-white">
        <div className="mb-6">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-4 ${
            agent.id === AgentType.TRIAGE ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {agent.role}
          </span>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">{agent.name}</h2>
          <p className="text-slate-600 leading-relaxed">{agent.description}</p>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm">
            <h4 className="font-semibold text-slate-800 mb-2">Capabilities:</h4>
            <ul className="list-disc list-inside text-slate-600 space-y-1">
              {agent.id === AgentType.FRONT_DESK ? (
                <>
                  <li>Patient Intake & Registration</li>
                  <li>Real-time Appointment Booking</li>
                  <li>Clinic FAQ Answering</li>
                </>
              ) : (
                <>
                  <li>Symptom Severity Assessment</li>
                  <li>Emergency Detection (911 Protocol)</li>
                  <li>Urgent Care Prioritization</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Right Panel: Interactive Demo */}
      <div className="p-8 md:w-1/2 flex flex-col items-center justify-center bg-slate-50 relative">
        {error && (
          <div className="absolute top-4 left-4 right-4 bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm border border-red-200 text-center">
            {error}
          </div>
        )}

        <div className="relative mb-8">
           {/* Visualizer Circle */}
          <div className={`w-40 h-40 rounded-full flex items-center justify-center transition-all duration-300 ${
            isConnected 
              ? isTalking 
                ? 'bg-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.5)]' 
                : 'bg-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)]'
              : 'bg-slate-200'
          }`}>
             {isConnected ? (
                <Activity className={`w-16 h-16 text-white ${isTalking ? 'animate-pulse' : ''}`} />
             ) : (
                <MicOff className="w-16 h-16 text-slate-400" />
             )}
          </div>
          
          {/* Audio Ring Animation based on volume */}
          {isConnected && !isTalking && (
             <div 
               className="absolute top-0 left-0 w-full h-full rounded-full border-2 border-green-400 opacity-50 pointer-events-none"
               style={{ transform: `scale(${1 + audioVolume})`, transition: 'transform 0.1s ease-out' }}
             />
          )}
        </div>

        <div className="text-center mb-8 h-12">
            {isConnected ? (
                <p className="text-lg font-medium text-slate-700 animate-pulse">
                    {isTalking ? `${agent.name} is speaking...` : "Listening..."}
                </p>
            ) : (
                <p className="text-slate-500">Click connect to start the demo</p>
            )}
        </div>

        <button
          onClick={toggleConnection}
          className={`flex items-center gap-3 px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-lg ${
            isConnected
              ? 'bg-rose-500 hover:bg-rose-600 text-white'
              : 'bg-slate-900 hover:bg-slate-800 text-white'
          }`}
        >
          {isConnected ? (
            <>
              <PhoneOff className="w-6 h-6" />
              End Call
            </>
          ) : (
            <>
              <Phone className="w-6 h-6" />
              Call {agent.name}
            </>
          )}
        </button>

        <p className="mt-6 text-xs text-slate-400 text-center max-w-xs">
          Microphone access required. Audio is processed in real-time via Gemini Live API.
        </p>
      </div>
    </div>
  );
};

export default VoiceDemo;