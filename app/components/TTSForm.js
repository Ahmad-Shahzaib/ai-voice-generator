"use client";
import { useState, useEffect } from "react";
import axios from "axios";

export default function TTSForm() {
  const [text, setText] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceId, setVoiceId] = useState("");
  const [voices, setVoices] = useState([]);
  const [fetchingVoices, setFetchingVoices] = useState(true);
  const [previewAudio, setPreviewAudio] = useState(""); // For playing preview

  // Fetch voices from backend on mount
  useEffect(() => {
    const fetchVoices = async () => {
      setFetchingVoices(true);
      try {
        const response = await axios.get("http://localhost:5000/api/voices");
        setVoices(response.data.voices || []);
        if (response.data.voices && response.data.voices.length > 0) {
          setVoiceId(response.data.voices[0].voice_id); // Set first voice as default
        }
      } catch (error) {
        console.error("Error fetching voices:", error);
        alert("Failed to load voices from ElevenLabs");
      } finally {
        setFetchingVoices(false);
      }
    };
    fetchVoices();
  }, []);

  const generateSpeech = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/api/generate-speech",
        { text, voiceId },
        { responseType: "blob" }
      );

      const audioBlob = new Blob([response.data], { type: "audio/mpeg" });
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudioUrl(audioUrl);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to generate speech");
    } finally {
      setLoading(false);
    }
  };

  // Play preview for a voice (uses ElevenLabs built-in preview_url - no credit cost)
  const playPreview = (previewUrl) => {
    if (previewAudio) {
      previewAudio.pause();
    }
    const audio = new Audio(previewUrl);
    audio.play();
    setPreviewAudio(audio);
  };

  // Fixed preview text for custom generation if no preview_url
  const PREVIEW_TEXT = "Hello, how are you?";

  // Generate preview on-the-fly if no preview_url (costs credits, use sparingly)
  const generatePreview = async (vId) => {
    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/api/generate-speech",
        { text: PREVIEW_TEXT, voiceId: vId },
        { responseType: "blob" }
      );
      const audioBlob = new Blob([response.data], { type: "audio/mpeg" });
      const previewUrl = URL.createObjectURL(audioBlob);
      playPreview(previewUrl);
    } catch (error) {
      console.error("Error generating preview:", error);
      alert("Failed to generate preview");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-4">
      <div className="w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">Text to Speech Generator</h1>
          </div>
          <p className="mt-2 text-indigo-200">Convert text into natural-sounding speech</p>
        </div>

        <div className="p-6 md:p-8">
          {/* Text Input */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Text to convert:</label>
            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 shadow-sm resize-none"
                rows={4}
                placeholder="Enter text here..."
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                {text.length}/5000
              </div>
            </div>
          </div>

          {/* Voice Selection */}
          <div className="mb-8">
            <label className="block text-gray-700 font-medium mb-2">Select Voice:</label>
            {fetchingVoices ? (
              <p className="text-gray-500">Loading voices from ElevenLabs...</p>
            ) : voices.length === 0 ? (
              <p className="text-red-500">No voices available. Check your API key.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {voices.map((voice) => (
                  <div
                    key={voice.voice_id}
                    onClick={() => setVoiceId(voice.voice_id)}
                    className={`p-4 border rounded-lg cursor-pointer transition duration-200 flex items-center space-x-3 ${
                      voiceId === voice.voice_id
                        ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                        : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
                    }`}
                  >
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      voice.labels && voice.labels.gender === "female" ? "bg-pink-100 text-pink-600" : "bg-blue-100 text-blue-600"
                    }`}>
                      {voice.labels && voice.labels.gender === "female" ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{voice.name}</div>
                      <div className="text-xs text-gray-500">
                        {voice.labels ? `${voice.labels.accent || ''} ${voice.labels.gender || ''}` : 'Unknown'}
                      </div>
                    </div>
                    {/* Preview Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent selecting voice on preview click
                        if (voice.preview_url) {
                          playPreview(voice.preview_url);
                        } else {
                          generatePreview(voice.voice_id);
                        }
                      }}
                      className="ml-auto p-2 bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-200 transition"
                      title="Play preview"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {voiceId === voice.voice_id && (
                      <div className="ml-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Click the play button on a voice to hear a sample ("Hello, how are you?"). 
              Pre-built previews (if available) won't cost credits. Custom previews use credits.
            </p>
          </div>

          {/* Generate Button */}
          <div className="flex justify-center">
            <button
              onClick={generateSpeech}
              disabled={loading || !text.trim() || !voiceId}
              className={`px-8 py-3 rounded-lg font-medium text-white shadow-lg transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                loading || !text.trim() || !voiceId
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              }`}
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </div>
              ) : (
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Generate Speech
                </div>
              )}
            </button>
          </div>

          {/* Audio Player */}
          {audioUrl && (
            <div className="mt-10 p-6 bg-gray-50 rounded-xl border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Generated Audio
              </h2>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <audio controls src={audioUrl} className="w-full" />
              </div>
              
              <div className="mt-4 flex justify-center">
                <a
                  href={audioUrl}
                  download="speech.mp3"
                  className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Download MP3
                </a>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 text-center text-sm text-gray-500 border-t">
          &copy; 2024 Text to Speech Generator. All rights reserved.
        </div>
      </div>
    </div>
  );
}