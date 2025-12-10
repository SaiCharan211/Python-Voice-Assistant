// import React, {
//   useEffect,
//   useRef,
//   useState,
//   useCallback,
//   useMemo,
// } from "react";
// import { sendQuery } from "./api"; 

// import Container from "@mui/material/Container";
// import Typography from "@mui/material/Typography";
// import TextField from "@mui/material/TextField";
// import Button from "@mui/material/Button";
// import Box from "@mui/material/Box";
// import Paper from "@mui/material/Paper";
// import Grid from "@mui/material/Grid";
// import Stack from "@mui/material/Stack";
// import IconButton from "@mui/material/IconButton";

// import MicIcon from "@mui/icons-material/Mic";
// import SendIcon from "@mui/icons-material/Send";
// import StopIcon from "@mui/icons-material/Stop";
// import ClearAllIcon from "@mui/icons-material/ClearAll";
// import DarkModeIcon from "@mui/icons-material/DarkMode";
// import LightModeIcon from "@mui/icons-material/LightMode";
// import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";

// import { ThemeProvider, CssBaseline } from "@mui/material";
// import { getTheme } from "./theme"; 
// import CommandsList from "./CommandsList";

// const MemoizedCommandsList = React.memo(CommandsList);

// export default function App() {
//   const [mode, setMode] = useState("light");
//   const [query, setQuery] = useState("");
//   const [response, setResponse] = useState("");
//   const [listening, setListening] = useState(false); 
//   const [wakeEnabled, setWakeEnabled] = useState(false);
//   const [wakeStatus, setWakeStatus] = useState("stopped");
//   const [initialized, setInitialized] = useState(false); 

//   const SpeechRecognition = useMemo(
//     () => window.SpeechRecognition || window.webkitSpeechRecognition || null,
//     []
//   );
//   const wakeRef = useRef(null);
//   const cmdRef = useRef(null);
//   const lastWakeTime = useRef(0);
//   const WAKE_DELAY = 1800; 
//   const wakeWords = useMemo(
//     () => ["hey google", "okay google", "hey assistant", "hello assistant"],
//     []
//   );
//   const synth = useRef(window.speechSynthesis);

//   const canStartWake = useCallback(() => {
//     return (
//       !synth.current.speaking &&
//       !listening &&
//       !wakeRef.current
//     );
//   }, [listening]);

//   const speakAndWait = useCallback((text) => {
//     return new Promise((resolve) => {
//       try {
//         if (!synth.current) return resolve();

//         if (synth.current.speaking) {
//           synth.current.cancel();
//         }

//         const u = new SpeechSynthesisUtterance(text || "");
//         u.onend = () => {
//           resolve();
//         };
//         u.onerror = (e) => {
//           resolve();
//         };
//         synth.current.speak(u);
//       } catch (e) {
//         resolve();
//       }
//     });
//   }, []);

//   const initMicrophone = useCallback(async () => {
//     try {
//       await navigator.mediaDevices.getUserMedia({ audio: true });
//       setInitialized(true);
//     } catch (e) {
//       alert("Microphone access required. Allow mic and retry Init.");
//     }
//   }, []);

//   const stopCommand = useCallback(() => {
//     if (cmdRef.current) {
//       try {
//         cmdRef.current.onresult = null;
//         cmdRef.current.onend = null;
//         cmdRef.current.onerror = null;
//         cmdRef.current.stop();
//       } catch (e) {
//         console.warn("stopCommand: stop() failed", e);
//       }
//     }
//     cmdRef.current = null;
//     setListening(false);
//   }, []);

//   const stopWake = useCallback(() => {
//     if (wakeRef.current) {
//       try {
//         wakeRef.current.onresult = null;
//         wakeRef.current.onend = null;
//         wakeRef.current.onerror = null;
//         wakeRef.current.stop();
//       } catch (e) {
//         console.warn("stopWake: stop() failed", e);
//       }
//     }
//     wakeRef.current = null;
//     setWakeStatus("stopped");
//   }, []);

//   let startWake;

//   const safeRestartWake = useCallback(() => {

//     setTimeout(() => {
//       let attempts = 0;
//       const maxAttempts = 10;

//       const tryStart = () => {
//         if (canStartWake()) {
//           wakeRef.current = null;
//           startWake(); 
//         } else {
//           attempts++;
//           if (attempts < maxAttempts) {
//             setTimeout(tryStart, 200);
//           } else {
//             console.log("[SAFE] Wake restart failed after retries.");
//           }
//         }
//       };
//       tryStart();
//     }, WAKE_DELAY);
//   }, [canStartWake]);

//   const startCommand = useCallback(() => {
//     if (!SpeechRecognition) {
//       alert("SpeechRecognition not supported in this browser.");
//       return;
//     }

//     stopCommand(); 

//     const r = new SpeechRecognition();
//     r.lang = "en-US";
//     r.interimResults = false;
//     r.continuous = false; 

//     r.onstart = () => {
//       setListening(true);
//     };

//     r.onresult = async (e) => {
//       const transcript = e.results[0][0].transcript.trim();
//       try {
//         setQuery(transcript);

//         const res = await sendQuery(transcript);
//         setResponse(res);

//         await speakAndWait(res);
//       } catch (err) {
//         console.error("[COMMAND] onresult error:", err);
//       }
//     };

//     r.onerror = (err) => {
//       if (wakeEnabled) safeRestartWake();
//     };

//     r.onend = () => {
//       setListening(false);
//       if (wakeEnabled) {
//         safeRestartWake();
//       }
//     };

//     try {
//       r.start();
//       cmdRef.current = r;
//     } catch (e) {
//       console.error("[COMMAND] start() error:", e);
//       if (wakeEnabled) safeRestartWake();
//     }
//   }, [SpeechRecognition, stopCommand, speakAndWait, wakeEnabled, safeRestartWake]);

//   startWake = useCallback(() => {
//     if (!SpeechRecognition) return;
//     if (wakeRef.current) return; 

//     const wr = new SpeechRecognition();
//     wr.lang = "en-US";
//     wr.interimResults = true;
//     wr.continuous = true;

//     wr.onstart = () => {
//       setWakeStatus("listening");
//     };

//     wr.onresult = (event) => {
//       let transcript = "";
//       for (let i = event.resultIndex; i < event.results.length; i++) {
//         transcript += event.results[i][0].transcript;
//       }
//       transcript = transcript.toLowerCase().trim();

//       const last = event.results[event.results.length - 1];
//       if (!last.isFinal) return; 

//       if (Date.now() - lastWakeTime.current < 2000) {
//         return;
//       }

//       const found = wakeWords.some((w) => transcript.includes(w));
//       if (!found) return;

//       console.log("[WAKE] DETECTED hotword:", transcript);
//       lastWakeTime.current = Date.now();

//       try {
//         wr.onresult = null;
//         wr.onend = null;
//         wr.onerror = null;
//         wr.stop();
//       } catch (e) {
//         console.warn("[WAKE] stop() threw:", e);
//       }
//       wakeRef.current = null;
//       setWakeStatus("paused");

//       (async () => {
//         await speakAndWait("Yes?");
//         setTimeout(() => startCommand(), 200);
//       })();
//     };

//     wr.onerror = (e) => {
//       console.warn("[WAKE] error:", e);
//       setWakeStatus("error");
//       if (wakeEnabled) safeRestartWake(); 
//     };

//     wr.onend = () => {
//       wakeRef.current = null;
//       setWakeStatus("stopped");
//       if (wakeEnabled) safeRestartWake(); 
//     };

//     try {
//       wr.start();
//       wakeRef.current = wr;
//     } catch (e) {
//       console.error("[WAKE] start() failed:", e);
//       wakeRef.current = null;
//       setWakeStatus("error");
//       if (wakeEnabled) safeRestartWake(); 
//     }
//   }, [SpeechRecognition, wakeWords, speakAndWait, startCommand, safeRestartWake, wakeEnabled]);


//   const toggleWake = useCallback(() => {
//     if (!initialized) {
//       alert("Press Init Microphone first (required by browsers).");
//       return;
//     }
//     if (!wakeEnabled) {
//       setWakeEnabled(true);
//       wakeRef.current = null;
//       safeRestartWake();
//     } else {
//       setWakeEnabled(false);
//       stopWake();
//     }
//   }, [initialized, wakeEnabled, safeRestartWake, stopWake]);

//   const handleSendQuery = useCallback(async () => {
//     if (!query.trim()) return;
//     const res = await sendQuery(query);
//     setResponse(res);
//     await speakAndWait(res);
//   }, [query, speakAndWait]);

//   const handleManualSpeak = useCallback(() => {
//     if (!initialized) {
//       alert("Press Init Microphone first.");
//       return;
//     }
//     stopWake(); 
//     startCommand();
//   }, [initialized, startCommand, stopWake]);

//   const handleStopAll = useCallback(() => {
//     stopCommand();
//     stopWake();
//     setWakeEnabled(false);
//   }, [stopCommand, stopWake]);

//   const handleReset = useCallback(() => {
//     handleStopAll();
//     setQuery("");
//     setResponse("");
//     setInitialized(false);
//     console.clear();
//   }, [handleStopAll]);

//   useEffect(() => {
//     const restartIfEnabled = () => {
//       if (wakeEnabled) {
//         if (wakeRef.current) stopWake();
//         safeRestartWake();
//       }
//     };

//     document.addEventListener("visibilitychange", restartIfEnabled);
//     window.addEventListener("focus", restartIfEnabled);
//     return () => {
//       document.removeEventListener("visibilitychange", restartIfEnabled);
//       window.removeEventListener("focus", restartIfEnabled);
//     };
//   }, [wakeEnabled, safeRestartWake, stopWake]);

//   useEffect(() => {
//     return () => {
//       stopWake();
//       stopCommand();
//       synth.current.cancel(); 
//     };

//   }, [stopWake, stopCommand]);

//   return (
//     <ThemeProvider theme={getTheme(mode)}>
//       <CssBaseline />
//       <Container maxWidth="lg" sx={{ mt: 6 }}>
//         <Grid container spacing={4}>
//           <Grid item xs={12} md={7}>
//             <Paper elevation={6} sx={{ p: 4, borderRadius: 4 }}>
//               <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
//                 <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
//                   Wake:{" "}
//                   <span style={{ color: wakeEnabled && wakeStatus === "listening" ? "green" : "orange" }}>
//                     {wakeEnabled ? wakeStatus : "off"}
//                   </span>
//                 </Typography>

//                 <Box>
//                   <IconButton onClick={() => setMode(mode === "light" ? "dark" : "light")}>
//                     {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
//                   </IconButton>

//                   <Button
//                     variant={wakeEnabled ? "contained" : "outlined"}
//                     startIcon={<PowerSettingsNewIcon />}
//                     onClick={toggleWake}
//                     sx={{ mr: 1 }}
//                   >
//                     {wakeEnabled ? "Disable Wake" : "Enable Wake"}
//                   </Button>
//                 </Box>
//               </Box>

//               <Typography variant="h4" align="center" sx={{ fontWeight: "bold", mb: 3 }}>
//                 Voice Assistant
//               </Typography>

//               <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
//                 <TextField
//                   fullWidth
//                   label="Type or speak a command"
//                   value={query}
//                   onChange={(e) => setQuery(e.target.value)}
//                   onKeyPress={(e) => {
//                     if (e.key === 'Enter') handleSendQuery();
//                   }}
//                 />
//                 <Button variant="contained" onClick={handleSendQuery}>
//                   <SendIcon />
//                 </Button>
//               </Box>

//               <Stack direction="row" spacing={2} justifyContent="center" mb={3}>
//                 <Button
//                   variant={listening ? "outlined" : "contained"}
//                   color={listening ? "secondary" : "primary"}
//                   onClick={handleManualSpeak}
//                   startIcon={<MicIcon />}
//                   disabled={!initialized} 
//                 >
//                   {listening ? "Listening..." : "Speak Command"}
//                 </Button>

//                 <Button
//                   variant="outlined"
//                   color="error"
//                   onClick={handleStopAll}
//                   startIcon={<StopIcon />}
//                 >
//                   Stop All
//                 </Button>

//                 <Button
//                   variant="outlined"
//                   color="info"
//                   onClick={initMicrophone}
//                   startIcon={<MicIcon />}
//                   disabled={initialized}
//                 >
//                   {initialized ? "Mic Initialized" : "Init Microphone"}
//                 </Button>

//                 <Button
//                   variant="outlined"
//                   color="warning"
//                   onClick={handleReset}
//                   startIcon={<ClearAllIcon />}
//                 >
//                   Reset App
//                 </Button>
//               </Stack>

//               <Paper elevation={2} sx={{ p: 3, minHeight: 140 }}>
//                 <Typography variant="subtitle2">Response:</Typography>
//                 <Typography variant="body1" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
//                   {response}
//                 </Typography>
//               </Paper>
//             </Paper>
//           </Grid>

//           <Grid item xs={12} md={5}>
//             <MemoizedCommandsList />
//           </Grid>
//         </Grid>
//       </Container>
//     </ThemeProvider>
//   );
// }
















// // ...existing code...
// import React, {
//   useEffect,
//   useRef,
//   useState,
//   useCallback,
//   useMemo,
// } from "react";
// import { sendQuery } from "./api";

// import Container from "@mui/material/Container";
// import Typography from "@mui/material/Typography";
// import TextField from "@mui/material/TextField";
// import Button from "@mui/material/Button";
// import Box from "@mui/material/Box";
// import Paper from "@mui/material/Paper";
// import Grid from "@mui/material/Grid";
// import Stack from "@mui/material/Stack";
// import IconButton from "@mui/material/IconButton";

// import MicIcon from "@mui/icons-material/Mic";
// import SendIcon from "@mui/icons-material/Send";
// import StopIcon from "@mui/icons-material/Stop";
// import ClearAllIcon from "@mui/icons-material/ClearAll";
// import DarkModeIcon from "@mui/icons-material/DarkMode";
// import LightModeIcon from "@mui/icons-material/LightMode";
// import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";

// import List from "@mui/material/List";
// import ListItem from "@mui/material/ListItem";
// import ListItemIcon from "@mui/material/ListItemIcon";
// import ListItemText from "@mui/material/ListItemText";
// import CheckCircleIcon from "@mui/icons-material/CheckCircle";
// import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
// import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
// import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";

// import { ThemeProvider, CssBaseline } from "@mui/material";
// import { getTheme } from "./theme";
// import CommandsList from "./CommandsList";

// import "./App.css";

// const MemoizedCommandsList = React.memo(CommandsList);

// export default function App() {
//   const [mode, setMode] = useState("light");
//   const [query, setQuery] = useState("");
//   const [response, setResponse] = useState("");
//   const [listening, setListening] = useState(false);
//   const [wakeEnabled, setWakeEnabled] = useState(false);
//   const [wakeStatus, setWakeStatus] = useState("stopped");
//   const [initialized, setInitialized] = useState(false);

//   const SpeechRecognition = useMemo(
//     () => window.SpeechRecognition || window.webkitSpeechRecognition || null,
//     []
//   );
//   const wakeRef = useRef(null);
//   const cmdRef = useRef(null);
//   const lastWakeTime = useRef(0);

//   // Made faster: lower delays so wake restarts and hotword guard act quicker
//   const WAKE_DELAY = 800; // lowered from larger value
//   const HOTWORD_GUARD = 800; // lower threshold between wake events

//   const wakeWords = useMemo(
//     () => ["hey google", "okay google", "hey assistant", "hello assistant"],
//     []
//   );
//   const synth = useRef(window.speechSynthesis || null);

//   // Use stable callback checks
//   const canStartWake = useCallback(() => {
//     return !synth.current?.speaking && !listening && !wakeRef.current;
//   }, [listening]);

//   const speakAndWait = useCallback((text) => {
//     return new Promise((resolve) => {
//       try {
//         if (!synth.current) return resolve();

//         if (synth.current.speaking) {
//           // cancel reduces overlap latency
//           synth.current.cancel();
//         }

//         const u = new SpeechSynthesisUtterance(text || "");
//         u.onend = () => resolve();
//         u.onerror = () => resolve();
//         synth.current.speak(u);
//       } catch (e) {
//         resolve();
//       }
//     });
//   }, []);

//   const initMicrophone = useCallback(async () => {
//     try {
//       await navigator.mediaDevices.getUserMedia({ audio: true });
//       setInitialized(true);
//     } catch (e) {
//       alert("Microphone access required. Allow mic and retry Init.");
//     }
//   }, []);

//   const stopCommand = useCallback(() => {
//     if (cmdRef.current) {
//       try {
//         cmdRef.current.onresult = null;
//         cmdRef.current.onend = null;
//         cmdRef.current.onerror = null;
//         cmdRef.current.stop();
//       } catch (e) {
//         console.warn("stopCommand: stop() failed", e);
//       }
//     }
//     cmdRef.current = null;
//     setListening(false);
//   }, []);

//   const stopWake = useCallback(() => {
//     if (wakeRef.current) {
//       try {
//         wakeRef.current.onresult = null;
//         wakeRef.current.onend = null;
//         wakeRef.current.onerror = null;
//         wakeRef.current.stop();
//       } catch (e) {
//         console.warn("stopWake: stop() failed", e);
//       }
//     }
//     wakeRef.current = null;
//     setWakeStatus("stopped");
//   }, []);

//   // keep startWake stable via ref to avoid re-creating on every render
//   const startWakeRef = useRef(null);

//   const safeRestartWake = useCallback(() => {
//     // faster restart attempts with short retries to improve responsiveness
//     const maxAttempts = 8;
//     let attempts = 0;
//     const tryStart = () => {
//       if (canStartWake()) {
//         wakeRef.current = null;
//         if (typeof startWakeRef.current === "function") startWakeRef.current();
//         return;
//       }
//       attempts++;
//       if (attempts < maxAttempts) {
//         // short retry interval
//         setTimeout(tryStart, 150);
//       } else {
//         console.log("[SAFE] Wake restart failed after retries.");
//       }
//     };
//     // small initial delay to avoid immediate conflicts with audio output
//     setTimeout(tryStart, WAKE_DELAY);
//   }, [canStartWake]);

//   const startCommand = useCallback(() => {
//     if (!SpeechRecognition) {
//       alert("SpeechRecognition not supported in this browser.");
//       return;
//     }

//     stopCommand();

//     const r = new SpeechRecognition();
//     r.lang = "en-US";
//     r.interimResults = false;
//     r.continuous = false;

//     r.onstart = () => setListening(true);

//     r.onresult = async (e) => {
//       const transcript = e.results[0][0].transcript.trim();
//       try {
//         setQuery(transcript);
//         const res = await sendQuery(transcript);
//         setResponse(res);
//         await speakAndWait(res);
//       } catch (err) {
//         console.error("[COMMAND] onresult error:", err);
//       }
//     };

//     r.onerror = () => {
//       if (wakeEnabled) safeRestartWake();
//     };

//     r.onend = () => {
//       setListening(false);
//       if (wakeEnabled) safeRestartWake();
//     };

//     try {
//       r.start();
//       cmdRef.current = r;
//     } catch (e) {
//       console.error("[COMMAND] start() error:", e);
//       if (wakeEnabled) safeRestartWake();
//     }
//   }, [SpeechRecognition, stopCommand, speakAndWait, wakeEnabled, safeRestartWake]);

//   // attach stable startWake implementation to ref
//   const startWake = useCallback(() => {
//     if (!SpeechRecognition) return;
//     if (wakeRef.current) return;

//     const wr = new SpeechRecognition();
//     wr.lang = "en-US";
//     wr.interimResults = true;
//     wr.continuous = true;

//     wr.onstart = () => setWakeStatus("listening");

//     wr.onresult = (event) => {
//       let transcript = "";
//       for (let i = event.resultIndex; i < event.results.length; i++) {
//         transcript += event.results[i][0].transcript;
//       }
//       transcript = transcript.toLowerCase().trim();

//       const last = event.results[event.results.length - 1];
//       if (!last.isFinal) return;

//       // faster hotword guard
//       if (Date.now() - lastWakeTime.current < HOTWORD_GUARD) return;

//       const found = wakeWords.some((w) => transcript.includes(w));
//       if (!found) return;

//       lastWakeTime.current = Date.now();
//       try {
//         wr.onresult = null;
//         wr.onend = null;
//         wr.onerror = null;
//         wr.stop();
//       } catch (e) {
//         console.warn("[WAKE] stop() threw:", e);
//       }
//       wakeRef.current = null;
//       setWakeStatus("paused");

//       (async () => {
//         await speakAndWait("Yes?");
//         // reduce wait before starting command to speed response
//         setTimeout(() => startCommand(), 120);
//       })();
//     };

//     wr.onerror = (e) => {
//       console.warn("[WAKE] error:", e);
//       setWakeStatus("error");
//       if (wakeEnabled) safeRestartWake();
//     };

//     wr.onend = () => {
//       wakeRef.current = null;
//       setWakeStatus("stopped");
//       if (wakeEnabled) safeRestartWake();
//     };

//     try {
//       wr.start();
//       wakeRef.current = wr;
//     } catch (e) {
//       console.error("[WAKE] start() failed:", e);
//       wakeRef.current = null;
//       setWakeStatus("error");
//       if (wakeEnabled) safeRestartWake();
//     }
//   }, [SpeechRecognition, wakeWords, speakAndWait, startCommand, safeRestartWake, wakeEnabled]);

//   // store stable ref
//   startWakeRef.current = startWake;

//   const toggleWake = useCallback(() => {
//     if (!initialized) {
//       alert("Press Init Microphone first (required by browsers).");
//       return;
//     }
//     if (!wakeEnabled) {
//       setWakeEnabled(true);
//       wakeRef.current = null;
//       safeRestartWake();
//     } else {
//       setWakeEnabled(false);
//       stopWake();
//     }
//   }, [initialized, wakeEnabled, safeRestartWake, stopWake]);

//   const handleSendQuery = useCallback(async () => {
//     if (!query.trim()) return;
//     const res = await sendQuery(query);
//     setResponse(res);
//     await speakAndWait(res);
//   }, [query, speakAndWait]);

//   const handleManualSpeak = useCallback(() => {
//     if (!initialized) {
//       alert("Press Init Microphone first.");
//       return;
//     }
//     stopWake();
//     startCommand();
//   }, [initialized, startCommand, stopWake]);

//   const handleStopAll = useCallback(() => {
//     stopCommand();
//     stopWake();
//     setWakeEnabled(false);
//   }, [stopCommand, stopWake]);

//   const handleReset = useCallback(() => {
//     handleStopAll();
//     setQuery("");
//     setResponse("");
//     setInitialized(false);
//     console.clear();
//   }, [handleStopAll]);

//   useEffect(() => {
//     const restartIfEnabled = () => {
//       if (document.visibilityState === "visible" && wakeEnabled) {
//         safeRestartWake();
//       } else if (!wakeEnabled) {
//         stopWake();
//       }
//     };

//     document.addEventListener("visibilitychange", restartIfEnabled);
//     return () => document.removeEventListener("visibilitychange", restartIfEnabled);
//   }, [wakeEnabled, safeRestartWake, stopWake]);

//   useEffect(() => {
//     // cleanup on unmount
//     return () => {
//       stopCommand();
//       stopWake();
//     };
//   }, [stopCommand, stopWake]);

//   return (
//     <ThemeProvider theme={getTheme(mode)}>
//       <CssBaseline />
//       <Container maxWidth="md" sx={{ py: 3 }}>
//         <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
//           <Typography variant="h4">AI Voice Assistant</Typography>
//           <Box>
//             <IconButton onClick={() => setMode(mode === "light" ? "dark" : "light")}>
//               {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
//             </IconButton>
//           </Box>
//         </Box>

//         <Paper sx={{ p: 2, mb: 3 }}>
//           <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
//             <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
//               Wake:{" "}
//               <span style={{ color: wakeEnabled && wakeStatus === "listening" ? "green" : wakeEnabled ? "orange" : "gray" }}>
//                 {wakeEnabled ? wakeStatus : "off"}
//               </span>
//             </Typography>

//             <Box>
//               <Button
//                 variant={wakeEnabled ? "contained" : "outlined"}
//                 startIcon={<PowerSettingsNewIcon />}
//                 onClick={toggleWake}
//                 sx={{ mr: 1 }}
//                 disabled={!initialized}
//               >
//                 {wakeEnabled ? "Disable Wake" : "Enable Wake"}
//               </Button>

//               <Button
//                 variant="outlined"
//                 sx={{ mr: 1 }}
//                 startIcon={wakeStatus === "listening" ? <PauseCircleOutlineIcon /> : <PlayCircleOutlineIcon />}
//                 onClick={() => {
//                   if (!wakeEnabled) return;
//                   if (wakeStatus === "listening") {
//                     stopWake();
//                   } else {
//                     safeRestartWake();
//                   }
//                 }}
//                 disabled={!wakeEnabled}
//               >
//                 {wakeStatus === "listening" ? "Pause Wake" : "Resume Wake"}
//               </Button>
//             </Box>
//           </Box>

//           <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
//             <Button variant="contained" startIcon={<MicIcon />} onClick={initMicrophone}>
//               Init Microphone
//             </Button>

//             <Button variant="outlined" startIcon={<MicIcon />} onClick={handleManualSpeak} disabled={!initialized}>
//               Speak Command
//             </Button>

//             <Button variant="outlined" startIcon={<StopIcon />} onClick={handleStopAll}>
//               Stop All
//             </Button>

//             <Button variant="text" startIcon={<ClearAllIcon />} onClick={handleReset}>
//               Reset
//             </Button>
//           </Stack>

//           <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
//             <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
//               Quick start — follow these steps:
//             </Typography>
//             <List dense>
//               <ListItem>
//                 <ListItemIcon>{initialized ? <CheckCircleIcon color="success" /> : <RadioButtonUncheckedIcon />}</ListItemIcon>
//                 <ListItemText primary="1) Click Init Microphone" secondary="Allow mic access when prompted" />
//               </ListItem>

//               <ListItem>
//                 <ListItemIcon>{initialized && wakeEnabled ? <CheckCircleIcon color="success" /> : <RadioButtonUncheckedIcon />}</ListItemIcon>
//                 <ListItemText primary="2) Enable Wake" secondary="Enables wake-word listening" />
//               </ListItem>

//               <ListItem>
//                 <ListItemIcon>{listening ? <CheckCircleIcon color="success" /> : <RadioButtonUncheckedIcon />}</ListItemIcon>
//                 <ListItemText primary="3) Say the wake word or press Speak Command" secondary='e.g., "Hey Assistant" → then say a command' />
//               </ListItem>
//             </List>
//           </Paper>

//           <Grid container spacing={2}>
//             <Grid item xs={12} md={6}>
//               <TextField
//                 fullWidth
//                 label="Query"
//                 value={query}
//                 onChange={(e) => setQuery(e.target.value)}
//                 variant="outlined"
//                 size="small"
//               />
//               <Button sx={{ mt: 1 }} variant="contained" onClick={handleSendQuery} disabled={!query.trim()}>
//                 <SendIcon sx={{ mr: 1 }} /> Send Query
//               </Button>
//             </Grid>

//             <Grid item xs={12} md={6}>
//               <TextField
//                 fullWidth
//                 multiline
//                 minRows={4}
//                 label="Response"
//                 value={response}
//                 variant="outlined"
//                 size="small"
//                 InputProps={{ readOnly: true }}
//               />
//             </Grid>
//           </Grid>
//         </Paper>

//         <MemoizedCommandsList />
//         <Typography variant="caption" color="text.secondary">
//           Note: Wake requires a browser with SpeechRecognition (Chrome/Edge). Initialize mic first, then enable wake.
//         </Typography>
//       </Container>
//     </ThemeProvider>
//   );
// }
// // ...existing code...



















// import React, {
//   useEffect,
//   useRef,
//   useState,
//   useCallback,
//   useMemo,
// } from "react";
// import { sendQuery } from "./api";

// import Container from "@mui/material/Container";
// import Typography from "@mui/material/Typography";
// import TextField from "@mui/material/TextField";
// import Button from "@mui/material/Button";
// import Box from "@mui/material/Box";
// import Paper from "@mui/material/Paper";
// import Grid from "@mui/material/Grid";
// import Stack from "@mui/material/Stack";
// import IconButton from "@mui/material/IconButton";

// import MicIcon from "@mui/icons-material/Mic";
// import SendIcon from "@mui/icons-material/Send";
// import StopIcon from "@mui/icons-material/Stop";
// import ClearAllIcon from "@mui/icons-material/ClearAll";
// import DarkModeIcon from "@mui/icons-material/DarkMode";
// import LightModeIcon from "@mui/icons-material/LightMode";
// import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";

// import { ThemeProvider, CssBaseline } from "@mui/material";
// import { getTheme } from "./theme";
// import CommandsList from "./CommandsList";

// const MemoizedCommandsList = React.memo(CommandsList);

// export default function App() {
//   const [mode, setMode] = useState("light");
//   const [query, setQuery] = useState("");
//   const [response, setResponse] = useState("");
//   const [listening, setListening] = useState(false);
//   const [wakeEnabled, setWakeEnabled] = useState(false);
//   const [wakeStatus, setWakeStatus] = useState("stopped");
//   const [initialized, setInitialized] = useState(false);

//   const SpeechRecognition = useMemo(
//     () => window.SpeechRecognition || window.webkitSpeechRecognition || null,
//     []
//   );
//   const wakeRef = useRef(null);
//   const cmdRef = useRef(null);
//   const lastWakeTime = useRef(0);
//   const WAKE_DELAY = 1800;
//   const wakeWords = useMemo(
//     () => ["hey google", "okay google", "hey assistant", "hello assistant"],
//     []
//   );
//   const synth = useRef(window.speechSynthesis);

//   const canStartWake = useCallback(() => {
//     return (
//       !synth.current.speaking &&
//       !listening &&
//       !wakeRef.current
//     );
//   }, [listening]);

//   const speakAndWait = useCallback((text) => {
//     return new Promise((resolve) => {
//       try {
//         if (!synth.current) return resolve();

//         if (synth.current.speaking) {
//           synth.current.cancel();
//         }

//         const u = new SpeechSynthesisUtterance(text || "");
//         u.onend = () => {
//           resolve();
//         };
//         u.onerror = () => {
//           resolve();
//         };
//         synth.current.speak(u);
//       } catch (e) {
//         resolve();
//       }
//     });
//   }, []);

//   const initMicrophone = useCallback(async () => {
//     try {
//       await navigator.mediaDevices.getUserMedia({ audio: true });
//       setInitialized(true);
//     } catch (e) {
//       alert("Microphone access required. Allow mic and retry Init.");
//     }
//   }, []);

//   const stopCommand = useCallback(() => {
//     if (cmdRef.current) {
//       try {
//         cmdRef.current.onresult = null;
//         cmdRef.current.onend = null;
//         cmdRef.current.onerror = null;
//         cmdRef.current.stop();
//       } catch (e) {
//         console.warn("stopCommand error:", e);
//       }
//     }
//     cmdRef.current = null;
//     setListening(false);
//   }, []);

//   const stopWake = useCallback(() => {
//     if (wakeRef.current) {
//       try {
//         wakeRef.current.onresult = null;
//         wakeRef.current.onend = null;
//         wakeRef.current.onerror = null;
//         wakeRef.current.stop();
//       } catch (e) {
//         console.warn("stopWake error:", e);
//       }
//     }
//     wakeRef.current = null;
//     setWakeStatus("stopped");
//   }, []);

//   let startWake;

//   const safeRestartWake = useCallback(() => {
//     setTimeout(() => {
//       let attempts = 0;

//       const tryStart = () => {
//         if (canStartWake()) {
//           wakeRef.current = null;
//           startWake();
//         } else {
//           attempts++;
//           if (attempts < 10) {
//             setTimeout(tryStart, 200);
//           }
//         }
//       };
//       tryStart();
//     }, WAKE_DELAY);
//   }, [canStartWake]);

//   const startCommand = useCallback(() => {
//     if (!SpeechRecognition) {
//       alert("SpeechRecognition not supported in this browser.");
//       return;
//     }

//     stopCommand();

//     const r = new SpeechRecognition();
//     r.lang = "en-US";
//     r.interimResults = false;
//     r.continuous = false;

//     r.onstart = () => {
//       setListening(true);
//     };

//     r.onresult = async (e) => {
//       const transcript = e.results[0][0].transcript.trim();
//       setQuery(transcript);

//       try {
//         const res = await sendQuery(transcript);
//         setResponse(res);
//         await speakAndWait(res);
//       } catch (err) {
//         console.error("onresult error:", err);
//       }
//     };

//     r.onerror = () => {
//       if (wakeEnabled) safeRestartWake();
//     };

//     r.onend = () => {
//       setListening(false);
//       if (wakeEnabled) safeRestartWake();
//     };

//     try {
//       r.start();
//       cmdRef.current = r;
//     } catch (e) {
//       if (wakeEnabled) safeRestartWake();
//     }
//   }, [SpeechRecognition, stopCommand, speakAndWait, wakeEnabled, safeRestartWake]);

//   startWake = useCallback(() => {
//     if (!SpeechRecognition) return;
//     if (wakeRef.current) return;

//     const wr = new SpeechRecognition();
//     wr.lang = "en-US";
//     wr.interimResults = true;
//     wr.continuous = true;

//     wr.onstart = () => {
//       setWakeStatus("listening");
//     };

//     wr.onresult = (event) => {
//       let transcript = "";
//       for (let i = event.resultIndex; i < event.results.length; i++) {
//         transcript += event.results[i][0].transcript;
//       }
//       transcript = transcript.toLowerCase().trim();

//       const last = event.results[event.results.length - 1];
//       if (!last.isFinal) return;

//       if (Date.now() - lastWakeTime.current < 2000) return;

//       const found = wakeWords.some((w) => transcript.includes(w));
//       if (!found) return;

//       lastWakeTime.current = Date.now();

//       try {
//         wr.onresult = null;
//         wr.onend = null;
//         wr.onerror = null;
//         wr.stop();
//       } catch { }

//       wakeRef.current = null;
//       setWakeStatus("paused");

//       (async () => {
//         await speakAndWait("Yes?");
//         setTimeout(() => startCommand(), 200);
//       })();
//     };

//     wr.onerror = () => {
//       setWakeStatus("error");
//       if (wakeEnabled) safeRestartWake();
//     };

//     wr.onend = () => {
//       wakeRef.current = null;
//       setWakeStatus("stopped");
//       if (wakeEnabled) safeRestartWake();
//     };

//     try {
//       wr.start();
//       wakeRef.current = wr;
//     } catch {
//       setWakeStatus("error");
//       if (wakeEnabled) safeRestartWake();
//     }
//   }, [SpeechRecognition, wakeWords, speakAndWait, startCommand, safeRestartWake, wakeEnabled]);

//   const toggleWake = useCallback(() => {
//     if (!initialized) {
//       alert("Press Init Microphone first.");
//       return;
//     }
//     if (!wakeEnabled) {
//       setWakeEnabled(true);
//       wakeRef.current = null;
//       safeRestartWake();
//     } else {
//       setWakeEnabled(false);
//       stopWake();
//     }
//   }, [initialized, wakeEnabled, safeRestartWake, stopWake]);

//   const handleSendQuery = useCallback(async () => {
//     if (!query.trim()) return;
//     const res = await sendQuery(query);
//     setResponse(res);
//     await speakAndWait(res);
//   }, [query, speakAndWait]);

//   const handleManualSpeak = useCallback(() => {
//     if (!initialized) return alert("Press Init Microphone first.");
//     stopWake();
//     startCommand();
//   }, [initialized, startCommand, stopWake]);

//   const handleStopAll = useCallback(() => {
//     stopCommand();
//     stopWake();
//     setWakeEnabled(false);
//   }, [stopCommand, stopWake]);

//   const handleReset = useCallback(() => {
//     handleStopAll();
//     setQuery("");
//     setResponse("");
//     setInitialized(false);
//     console.clear();
//   }, [handleStopAll]);

//   useEffect(() => {
//     const restartIfEnabled = () => {
//       if (wakeEnabled) {
//         if (wakeRef.current) stopWake();
//         safeRestartWake();
//       }
//     };
//     document.addEventListener("visibilitychange", restartIfEnabled);
//     window.addEventListener("focus", restartIfEnabled);
//     return () => {
//       document.removeEventListener("visibilitychange", restartIfEnabled);
//       window.removeEventListener("focus", restartIfEnabled);
//     };
//   }, [wakeEnabled, safeRestartWake, stopWake]);

//   useEffect(() => {
//     return () => {
//       stopWake();
//       stopCommand();
//       synth.current.cancel();
//     };
//   }, [stopWake, stopCommand]);

//   return (
//     <ThemeProvider theme={getTheme(mode)}>
//       <CssBaseline />
//       <Container maxWidth="lg" sx={{ mt: 6 }}>
//         <Grid container spacing={4}>
//           <Grid item xs={12} md={7}>
//             <Paper elevation={6} sx={{ p: 4, borderRadius: 4 }}>
//               <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
//                 <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
//                   Wake:{" "}
//                   <span
//                     style={{
//                       color:
//                         wakeEnabled && wakeStatus === "listening"
//                           ? "green"
//                           : "orange",
//                     }}
//                   >
//                     {wakeEnabled ? wakeStatus : "off"}
//                   </span>
//                 </Typography>

//                 <Box>
//                   <IconButton onClick={() => setMode(mode === "light" ? "dark" : "light")}>
//                     {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
//                   </IconButton>

//                   <Button
//                     variant={wakeEnabled ? "contained" : "outlined"}
//                     startIcon={<PowerSettingsNewIcon />}
//                     onClick={toggleWake}
//                     sx={{ mr: 1 }}
//                   >
//                     {wakeEnabled ? "Disable Wake" : "Enable Wake"}
//                   </Button>
//                 </Box>
//               </Box>

//               <Typography variant="h4" align="center" sx={{ fontWeight: "bold", mb: 3 }}>
//                 Voice Assistant
//               </Typography>

//               {/* ✅ Instructions Section */}
//               <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 3 }}>
//                 <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
//                   Usage Checklist
//                 </Typography>

//                 {/* 1. Microphone initialized */}
//                 <Typography variant="body2" sx={{ mb: 1, color: initialized ? "green" : "gray" }}>
//                   {initialized ? "✓" : "○"} Init Microphone
//                 </Typography>

//                 {/* 2. Wake word enabled */}
//                 <Typography variant="body2" sx={{ mb: 1, color: wakeEnabled ? "green" : "gray" }}>
//                   {wakeEnabled ? "✓" : "○"} Wake Word Enabled
//                 </Typography>

//                 {/* 3. Wake listening active */}
//                 <Typography
//                   variant="body2"
//                   sx={{
//                     mb: 1,
//                     color:
//                       wakeEnabled && wakeStatus === "listening" ? "green" : "gray",
//                   }}
//                 >
//                   {wakeEnabled && wakeStatus === "listening" ? "✓" : "○"} Listening for Wake Word
//                 </Typography>

//                 {/* 4. Wake word triggered */}
//                 <Typography
//                   variant="body2"
//                   sx={{
//                     mb: 1,
//                     color:
//                       wakeStatus === "paused" ? "green" : "gray",
//                   }}
//                 >
//                   {wakeStatus === "paused" ? "✓" : "○"} Wake Word Detected
//                 </Typography>

//                 {/* 5. Command listening mode */}
//                 <Typography variant="body2" sx={{ mb: 1, color: listening ? "green" : "gray" }}>
//                   {listening ? "✓" : "○"} Listening for Command
//                 </Typography>

//                 {/* 6. Response produced */}
//                 <Typography
//                   variant="body2"
//                   sx={{
//                     mb: 1,
//                     color: response.trim() ? "green" : "gray",
//                   }}
//                 >
//                   {response.trim() ? "✓" : "○"} Response Generated
//                 </Typography>

//                 {/* 7. Manual OR Type Command */}
//                 <Typography variant="body2" sx={{ color: query.trim() ? "green" : "gray" }}>
//                   {query.trim() ? "✓" : "○"} Command Entered
//                 </Typography>
//               </Paper>


//               <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
//                 <TextField
//                   fullWidth
//                   label="Type or speak a command"
//                   value={query}
//                   onChange={(e) => setQuery(e.target.value)}
//                   onKeyPress={(e) => {
//                     if (e.key === "Enter") handleSendQuery();
//                   }}
//                 />
//                 <Button variant="contained" onClick={handleSendQuery}>
//                   <SendIcon />
//                 </Button>
//               </Box>

//               <Stack direction="row" spacing={2} justifyContent="center" mb={3}>
//                 <Button
//                   variant={listening ? "outlined" : "contained"}
//                   color={listening ? "secondary" : "primary"}
//                   onClick={handleManualSpeak}
//                   startIcon={<MicIcon />}
//                   disabled={!initialized}
//                 >
//                   {listening ? "Listening..." : "Speak Command"}
//                 </Button>

//                 <Button
//                   variant="outlined"
//                   color="error"
//                   onClick={handleStopAll}
//                   startIcon={<StopIcon />}
//                 >
//                   Stop All
//                 </Button>

//                 <Button
//                   variant="outlined"
//                   color="info"
//                   onClick={initMicrophone}
//                   startIcon={<MicIcon />}
//                   disabled={initialized}
//                 >
//                   {initialized ? "Mic Initialized" : "Init Microphone"}
//                 </Button>

//                 <Button
//                   variant="outlined"
//                   color="warning"
//                   onClick={handleReset}
//                   startIcon={<ClearAllIcon />}
//                 >
//                   Reset App
//                 </Button>
//               </Stack>

//               <Paper elevation={2} sx={{ p: 3, minHeight: 140 }}>
//                 <Typography variant="subtitle2">Response:</Typography>
//                 <Typography variant="body1" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
//                   {response}
//                 </Typography>
//               </Paper>
//             </Paper>
//           </Grid>

//           <Grid item xs={12} md={5}>
//             <MemoizedCommandsList />
//           </Grid>
//         </Grid>
//       </Container>
//     </ThemeProvider>
//   );
// }




























// import React, {
//   useEffect,
//   useRef,
//   useState,
//   useCallback,
//   useMemo,
// } from "react";
// import { sendQuery } from "./api";

// import Container from "@mui/material/Container";
// import Typography from "@mui/material/Typography";
// import TextField from "@mui/material/TextField";
// import Button from "@mui/material/Button";
// import Box from "@mui/material/Box";
// import Paper from "@mui/material/Paper";
// import Grid from "@mui/material/Grid";
// import Stack from "@mui/material/Stack";
// import IconButton from "@mui/material/IconButton";

// import MicIcon from "@mui/icons-material/Mic";
// import SendIcon from "@mui/icons-material/Send";
// import StopIcon from "@mui/icons-material/Stop";
// import ClearAllIcon from "@mui/icons-material/ClearAll";
// import DarkModeIcon from "@mui/icons-material/DarkMode";
// import LightModeIcon from "@mui/icons-material/LightMode";
// import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";

// import { ThemeProvider, CssBaseline } from "@mui/material";
// import { getTheme } from "./theme";
// import CommandsList from "./CommandsList";

// const MemoizedCommandsList = React.memo(CommandsList);

// export default function App() {
//   const [mode, setMode] = useState("light");
//   const [query, setQuery] = useState("");
//   const [response, setResponse] = useState("");
//   const [listening, setListening] = useState(false);
//   const [wakeEnabled, setWakeEnabled] = useState(false);
//   const [wakeStatus, setWakeStatus] = useState("stopped");
//   const [initialized, setInitialized] = useState(false);

//   const SpeechRecognition = useMemo(
//     () => window.SpeechRecognition || window.webkitSpeechRecognition || null,
//     []
//   );
//   const wakeRef = useRef(null);
//   const cmdRef = useRef(null);
//   const lastWakeTime = useRef(0);
//   const WAKE_DELAY = 1800;
//   const wakeWords = useMemo(
//     () => ["hey google", "okay google", "hey assistant", "hello assistant"],
//     []
//   );
//   const synth = useRef(window.speechSynthesis);

//   const canStartWake = useCallback(() => {
//     return (
//       !synth.current.speaking &&
//       !listening &&
//       !wakeRef.current
//     );
//   }, [listening]);

//   const speakAndWait = useCallback((text) => {
//     return new Promise((resolve) => {
//       try {
//         if (!synth.current) return resolve();

//         if (synth.current.speaking) {
//           synth.current.cancel();
//         }

//         const u = new SpeechSynthesisUtterance(text || "");
//         u.onend = () => {
//           resolve();
//         };
//         u.onerror = () => {
//           resolve();
//         };
//         synth.current.speak(u);
//       } catch (e) {
//         resolve();
//       }
//     });
//   }, []);

//   const initMicrophone = useCallback(async () => {
//     try {
//       await navigator.mediaDevices.getUserMedia({ audio: true });
//       setInitialized(true);
//     } catch (e) {
//       alert("Microphone access required. Allow mic and retry Init.");
//     }
//   }, []);

//   const stopCommand = useCallback(() => {
//     if (cmdRef.current) {
//       try {
//         cmdRef.current.onresult = null;
//         cmdRef.current.onend = null;
//         cmdRef.current.onerror = null;
//         cmdRef.current.stop();
//       } catch (e) {
//         console.warn("stopCommand error:", e);
//       }
//     }
//     cmdRef.current = null;
//     setListening(false);
//   }, []);

//   const stopWake = useCallback(() => {
//     if (wakeRef.current) {
//       try {
//         wakeRef.current.onresult = null;
//         wakeRef.current.onend = null;
//         wakeRef.current.onerror = null;
//         wakeRef.current.stop();
//       } catch (e) {
//         console.warn("stopWake error:", e);
//       }
//     }
//     wakeRef.current = null;
//     setWakeStatus("stopped");
//   }, []);

//   let startWake;

//   const safeRestartWake = useCallback(() => {
//     setTimeout(() => {
//       let attempts = 0;

//       const tryStart = () => {
//         if (canStartWake()) {
//           wakeRef.current = null;
//           startWake();
//         } else {
//           attempts++;
//           if (attempts < 10) {
//             setTimeout(tryStart, 200);
//           }
//         }
//       };
//       tryStart();
//     }, WAKE_DELAY);
//   }, [canStartWake]);

//   const startCommand = useCallback(() => {
//     if (!SpeechRecognition) {
//       alert("SpeechRecognition not supported in this browser.");
//       return;
//     }

//     stopCommand();

//     const r = new SpeechRecognition();
//     r.lang = "en-US";
//     r.interimResults = false;
//     r.continuous = false;

//     r.onstart = () => {
//       setListening(true);
//     };

//     r.onresult = async (e) => {
//       const transcript = e.results[0][0].transcript.trim();
//       setQuery(transcript);

//       try {
//         const res = await sendQuery(transcript);
//         setResponse(res);
//         await speakAndWait(res);
//       } catch (err) {
//         console.error("onresult error:", err);
//       }
//     };

//     r.onerror = () => {
//       if (wakeEnabled) safeRestartWake();
//     };

//     r.onend = () => {
//       setListening(false);
//       if (wakeEnabled) safeRestartWake();
//     };

//     try {
//       r.start();
//       cmdRef.current = r;
//     } catch (e) {
//       if (wakeEnabled) safeRestartWake();
//     }
//   }, [SpeechRecognition, stopCommand, speakAndWait, wakeEnabled, safeRestartWake]);

//   startWake = useCallback(() => {
//     if (!SpeechRecognition) return;
//     if (wakeRef.current) return;

//     const wr = new SpeechRecognition();
//     wr.lang = "en-US";
//     wr.interimResults = true;
//     wr.continuous = true;

//     wr.onstart = () => {
//       setWakeStatus("listening");
//     };

//     wr.onresult = (event) => {
//       let transcript = "";
//       for (let i = event.resultIndex; i < event.results.length; i++) {
//         transcript += event.results[i][0].transcript;
//       }
//       transcript = transcript.toLowerCase().trim();

//       const last = event.results[event.results.length - 1];
//       if (!last.isFinal) return;

//       if (Date.now() - lastWakeTime.current < 2000) return;

//       const found = wakeWords.some((w) => transcript.includes(w));
//       if (!found) return;

//       lastWakeTime.current = Date.now();

//       try {
//         wr.onresult = null;
//         wr.onend = null;
//         wr.onerror = null;
//         wr.stop();
//       } catch { }

//       wakeRef.current = null;
//       setWakeStatus("paused");

//       (async () => {
//         await speakAndWait("Yes?");
//         setTimeout(() => startCommand(), 200);
//       })();
//     };

//     wr.onerror = () => {
//       setWakeStatus("error");
//       if (wakeEnabled) safeRestartWake();
//     };

//     wr.onend = () => {
//       wakeRef.current = null;
//       setWakeStatus("stopped");
//       if (wakeEnabled) safeRestartWake();
//     };

//     try {
//       wr.start();
//       wakeRef.current = wr;
//     } catch {
//       setWakeStatus("error");
//       if (wakeEnabled) safeRestartWake();
//     }
//   }, [SpeechRecognition, wakeWords, speakAndWait, startCommand, safeRestartWake, wakeEnabled]);

//   const toggleWake = useCallback(() => {
//     if (!initialized) {
//       alert("Press Init Microphone first.");
//       return;
//     }
//     if (!wakeEnabled) {
//       setWakeEnabled(true);
//       wakeRef.current = null;
//       safeRestartWake();
//     } else {
//       setWakeEnabled(false);
//       stopWake();
//     }
//   }, [initialized, wakeEnabled, safeRestartWake, stopWake]);

//   const handleSendQuery = useCallback(async () => {
//     if (!query.trim()) return;
//     const res = await sendQuery(query);
//     setResponse(res);
//     await speakAndWait(res);
//   }, [query, speakAndWait]);

//   const handleManualSpeak = useCallback(() => {
//     if (!initialized) return alert("Press Init Microphone first.");
//     stopWake();
//     startCommand();
//   }, [initialized, startCommand, stopWake]);

//   const handleStopAll = useCallback(() => {
//     stopCommand();
//     stopWake();
//     setWakeEnabled(false);
//   }, [stopCommand, stopWake]);

//   const handleReset = useCallback(() => {
//     handleStopAll();
//     setQuery("");
//     setResponse("");
//     setInitialized(false);
//     console.clear();
//   }, [handleStopAll]);

//   useEffect(() => {
//     const restartIfEnabled = () => {
//       if (wakeEnabled) {
//         if (wakeRef.current) stopWake();
//         safeRestartWake();
//       }
//     };
//     document.addEventListener("visibilitychange", restartIfEnabled);
//     window.addEventListener("focus", restartIfEnabled);
//     return () => {
//       document.removeEventListener("visibilitychange", restartIfEnabled);
//       window.removeEventListener("focus", restartIfEnabled);
//     };
//   }, [wakeEnabled, safeRestartWake, stopWake]);

//   useEffect(() => {
//     return () => {
//       stopWake();
//       stopCommand();
//       synth.current.cancel();
//     };
//   }, [stopWake, stopCommand]);

//   return (
//     <ThemeProvider theme={getTheme(mode)}>
//       <CssBaseline />
//       <Container maxWidth="lg" sx={{ mt: 2 }}>
//         <Grid container spacing={4}>
//           <Grid item xs={12} md={4} height="50%" width='50%' >
//             <Paper elevation={6} sx={{ p: 4, borderRadius: 4 }}>
//               <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
//                 <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
//                   Wake:{" "}
//                   <span
//                     style={{
//                       color:
//                         wakeEnabled && wakeStatus === "listening"
//                           ? "green"
//                           : "orange",
//                     }}
//                   >
//                     {wakeEnabled ? wakeStatus : "off"}
//                   </span>
//                 </Typography>

//                 <Box>
//                   <IconButton onClick={() => setMode(mode === "light" ? "dark" : "light")}>
//                     {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
//                   </IconButton>

//                   <Button
//                     variant={wakeEnabled ? "contained" : "outlined"}
//                     startIcon={<PowerSettingsNewIcon />}
//                     onClick={toggleWake}
//                     sx={{ mr: 1 }}
//                   >
//                     {wakeEnabled ? "Disable Wake" : "Enable Wake"}
//                   </Button>
//                 </Box>
//               </Box>

//               <Typography variant="h4" align="center" sx={{ fontWeight: "bold", mb: 3 }}>
//                 Voice Assistant
//               </Typography>

//               <Paper elevation={1} sx={{ p: 2, mb: 2, borderRadius: 3 }}>
//                 <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
//                   Usage Checklist
//                 </Typography>

//                 <Typography variant="body2" sx={{ mb: 1, color: initialized ? "green" : "gray" }}>
//                   {initialized ? "✓" : "○"} Init Microphone
//                 </Typography>

//                 <Typography variant="body2" sx={{ mb: 1, color: wakeEnabled ? "green" : "gray" }}>
//                   {wakeEnabled ? "✓" : "○"} Wake Word Enabled
//                 </Typography>

//                 <Typography
//                   variant="body2"
//                   sx={{
//                     mb: 1,
//                     color:
//                       wakeEnabled && wakeStatus === "listening" ? "green" : "gray",
//                   }}
//                 >
//                   {wakeEnabled && wakeStatus === "listening" ? "✓" : "○"} Listening for Wake Word
//                 </Typography>

//                 <Typography
//                   variant="body2"
//                   sx={{
//                     mb: 1,
//                     color:
//                       wakeStatus === "paused" ? "green" : "gray",
//                   }}
//                 >
//                   {wakeStatus === "paused" ? "✓" : "○"} Wake Word Detected
//                 </Typography>

//                 <Typography variant="body2" sx={{ mb: 1, color: listening ? "green" : "gray" }}>
//                   {listening ? "✓" : "○"} Listening for Command
//                 </Typography>

//                 <Typography
//                   variant="body2"
//                   sx={{
//                     mb: 1,
//                     color: response.trim() ? "green" : "gray",
//                   }}
//                 >
//                   {response.trim() ? "✓" : "○"} Response Generated
//                 </Typography>

//                 <Typography variant="body2" sx={{ color: query.trim() ? "green" : "gray" }}>
//                   {query.trim() ? "✓" : "○"} Command Entered
//                 </Typography>
//               </Paper>


//               <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
//                 <TextField
//                   fullWidth
//                   label="Type or speak a command"
//                   value={query}
//                   onChange={(e) => setQuery(e.target.value)}
//                   onKeyPress={(e) => {
//                     if (e.key === "Enter") handleSendQuery();
//                   }}
//                 />
//                 <Button variant="contained" onClick={handleSendQuery}>
//                   <SendIcon />
//                 </Button>
//               </Box>

//               <Stack direction="row" spacing={2} justifyContent="center" mb={3}>
//                 <Button
//                   variant={listening ? "outlined" : "contained"}
//                   color={listening ? "secondary" : "primary"}
//                   onClick={handleManualSpeak}
//                   startIcon={<MicIcon />}
//                   disabled={!initialized}
//                 >
//                   {listening ? "Listening..." : "Speak Command"}
//                 </Button>

//                 <Button
//                   variant="outlined"
//                   color="error"
//                   onClick={handleStopAll}
//                   startIcon={<StopIcon />}
//                 >
//                   Stop All
//                 </Button>

//                 <Button
//                   variant="outlined"
//                   color="info"
//                   onClick={initMicrophone}
//                   startIcon={<MicIcon />}
//                   disabled={initialized}
//                 >
//                   {initialized ? "Mic Initialized" : "Init Microphone"}
//                 </Button>

//                 <Button
//                   variant="outlined"
//                   color="warning"
//                   onClick={handleReset}
//                   startIcon={<ClearAllIcon />}
//                 >
//                   Reset App
//                 </Button>
//               </Stack>

//               <Paper elevation={2} sx={{ p: 3, minHeight: 140 }}>
//                 <Typography variant="subtitle2">Response:</Typography>
//                 <Typography variant="body1" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
//                   {response}
//                 </Typography>
//               </Paper>
//             </Paper>
//           </Grid>

//           <Grid item xs={12} md={5}>
//             <MemoizedCommandsList />
//           </Grid>
//         </Grid>
//       </Container>
//     </ThemeProvider>
//   );
// }
















// import React, {
//   useEffect,
//   useRef,
//   useState,
//   useCallback,
//   useMemo,
// } from "react";
// import { sendQuery } from "./api";

// import Container from "@mui/material/Container";
// import Typography from "@mui/material/Typography";
// import TextField from "@mui/material/TextField";
// import Button from "@mui/material/Button";
// import Box from "@mui/material/Box";
// import Paper from "@mui/material/Paper";
// import Grid from "@mui/material/Grid";
// import Stack from "@mui/material/Stack";
// import IconButton from "@mui/material/IconButton";

// import MicIcon from "@mui/icons-material/Mic";
// import SendIcon from "@mui/icons-material/Send";
// import StopIcon from "@mui/icons-material/Stop";
// import ClearAllIcon from "@mui/icons-material/ClearAll";
// import DarkModeIcon from "@mui/icons-material/DarkMode";
// import LightModeIcon from "@mui/icons-material/LightMode";
// import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";

// import { ThemeProvider, CssBaseline } from "@mui/material";
// import { getTheme } from "./theme";
// import CommandsList from "./CommandsList";

// const MemoizedCommandsList = React.memo(CommandsList);

// export default function App() {
//   const [mode, setMode] = useState("light");
//   const [query, setQuery] = useState("");
//   const [response, setResponse] = useState("");
//   const [listening, setListening] = useState(false);
//   const [wakeEnabled, setWakeEnabled] = useState(false);
//   const [wakeStatus, setWakeStatus] = useState("stopped");
//   const [initialized, setInitialized] = useState(false);

//   const SpeechRecognition = useMemo(
//     () => window.SpeechRecognition || window.webkitSpeechRecognition || null,
//     []
//   );
//   const wakeRef = useRef(null);
//   const cmdRef = useRef(null);
//   const lastWakeTime = useRef(0);
//   const WAKE_DELAY = 1800;
//   const wakeWords = useMemo(
//     () => ["hey google", "okay google", "hey assistant", "hello assistant"],
//     []
//   );
//   const synth = useRef(window.speechSynthesis);

//   const canStartWake = useCallback(() => {
//     return (
//       !synth.current.speaking &&
//       !listening &&
//       !wakeRef.current
//     );
//   }, [listening]);

//   const speakAndWait = useCallback((text) => {
//     return new Promise((resolve) => {
//       try {
//         if (!synth.current) return resolve();

//         if (synth.current.speaking) {
//           synth.current.cancel();
//         }

//         const u = new SpeechSynthesisUtterance(text || "");
//         u.onend = () => {
//           resolve();
//         };
//         u.onerror = () => {
//           resolve();
//         };
//         synth.current.speak(u);
//       } catch (e) {
//         resolve();
//       }
//     });
//   }, []);

//   const initMicrophone = useCallback(async () => {
//     try {
//       await navigator.mediaDevices.getUserMedia({ audio: true });
//       setInitialized(true);
//     } catch (e) {
//       alert("Microphone access required. Allow mic and retry Init.");
//     }
//   }, []);

//   const stopCommand = useCallback(() => {
//     if (cmdRef.current) {
//       try {
//         cmdRef.current.onresult = null;
//         cmdRef.current.onend = null;
//         cmdRef.current.onerror = null;
//         cmdRef.current.stop();
//       } catch (e) {
//         console.warn("stopCommand error:", e);
//       }
//     }
//     cmdRef.current = null;
//     setListening(false);
//   }, []);

//   const stopWake = useCallback(() => {
//     if (wakeRef.current) {
//       try {
//         wakeRef.current.onresult = null;
//         wakeRef.current.onend = null;
//         wakeRef.current.onerror = null;
//         wakeRef.current.stop();
//       } catch (e) {
//         console.warn("stopWake error:", e);
//       }
//     }
//     wakeRef.current = null;
//     setWakeStatus("stopped");
//   }, []);

//   let startWake;

//   const safeRestartWake = useCallback(() => {
//     setTimeout(() => {
//       let attempts = 0;

//       const tryStart = () => {
//         if (canStartWake()) {
//           wakeRef.current = null;
//           startWake();
//         } else {
//           attempts++;
//           if (attempts < 10) {
//             setTimeout(tryStart, 200);
//           }
//         }
//       };
//       tryStart();
//     }, WAKE_DELAY);
//   }, [canStartWake]);

//   const startCommand = useCallback(() => {
//     if (!SpeechRecognition) {
//       alert("SpeechRecognition not supported in this browser.");
//       return;
//     }

//     stopCommand();

//     const r = new SpeechRecognition();
//     r.lang = "en-US";
//     r.interimResults = false;
//     r.continuous = false;

//     r.onstart = () => {
//       setListening(true);
//     };

//     r.onresult = async (e) => {
//       const transcript = e.results[0][0].transcript.trim();
//       setQuery(transcript);

//       try {
//         const res = await sendQuery(transcript);
//         setResponse(res);
//         await speakAndWait(res);
//       } catch (err) {
//         console.error("onresult error:", err);
//       }
//     };

//     r.onerror = () => {
//       if (wakeEnabled) safeRestartWake();
//     };

//     r.onend = () => {
//       setListening(false);
//       if (wakeEnabled) safeRestartWake();
//     };

//     try {
//       r.start();
//       cmdRef.current = r;
//     } catch (e) {
//       if (wakeEnabled) safeRestartWake();
//     }
//   }, [SpeechRecognition, stopCommand, speakAndWait, wakeEnabled, safeRestartWake]);

//   startWake = useCallback(() => {
//     if (!SpeechRecognition) return;
//     if (wakeRef.current) return;

//     const wr = new SpeechRecognition();
//     wr.lang = "en-US";
//     wr.interimResults = true;
//     wr.continuous = true;

//     wr.onstart = () => {
//       setWakeStatus("listening");
//     };

//     wr.onresult = (event) => {
//       let transcript = "";
//       for (let i = event.resultIndex; i < event.results.length; i++) {
//         transcript += event.results[i][0].transcript;
//       }
//       transcript = transcript.toLowerCase().trim();

//       const last = event.results[event.results.length - 1];
//       if (!last.isFinal) return;

//       if (Date.now() - lastWakeTime.current < 2000) return;

//       const found = wakeWords.some((w) => transcript.includes(w));
//       if (!found) return;

//       lastWakeTime.current = Date.now();

//       try {
//         wr.onresult = null;
//         wr.onend = null;
//         wr.onerror = null;
//         wr.stop();
//       } catch { }

//       wakeRef.current = null;
//       setWakeStatus("paused");

//       (async () => {
//         await speakAndWait("Yes?");
//         setTimeout(() => startCommand(), 200);
//       })();
//     };

//     wr.onerror = () => {
//       setWakeStatus("error");
//       if (wakeEnabled) safeRestartWake();
//     };

//     wr.onend = () => {
//       wakeRef.current = null;
//       setWakeStatus("stopped");
//       if (wakeEnabled) safeRestartWake();
//     };

//     try {
//       wr.start();
//       wakeRef.current = wr;
//     } catch {
//       setWakeStatus("error");
//       if (wakeEnabled) safeRestartWake();
//     }
//   }, [SpeechRecognition, wakeWords, speakAndWait, startCommand, safeRestartWake, wakeEnabled]);

//   const toggleWake = useCallback(() => {
//     if (!initialized) {
//       alert("Press Init Microphone first.");
//       return;
//     }
//     if (!wakeEnabled) {
//       setWakeEnabled(true);
//       wakeRef.current = null;
//       safeRestartWake();
//     } else {
//       setWakeEnabled(false);
//       stopWake();
//     }
//   }, [initialized, wakeEnabled, safeRestartWake, stopWake]);

//   const handleSendQuery = useCallback(async () => {
//     if (!query.trim()) return;
//     const res = await sendQuery(query);
//     setResponse(res);
//     await speakAndWait(res);
//   }, [query, speakAndWait]);

//   const handleManualSpeak = useCallback(() => {
//     if (!initialized) return alert("Press Init Microphone first.");
//     stopWake();
//     startCommand();
//   }, [initialized, startCommand, stopWake]);

//   const handleStopAll = useCallback(() => {
//     stopCommand();
//     stopWake();
//     setWakeEnabled(false);
//   }, [stopCommand, stopWake]);

//   const handleReset = useCallback(() => {
//     handleStopAll();
//     setQuery("");
//     setResponse("");
//     setInitialized(false);
//     console.clear();
//   }, [handleStopAll]);

//   useEffect(() => {
//     const restartIfEnabled = () => {
//       if (wakeEnabled) {
//         if (wakeRef.current) stopWake();
//         safeRestartWake();
//       }
//     };
//     document.addEventListener("visibilitychange", restartIfEnabled);
//     window.addEventListener("focus", restartIfEnabled);
//     return () => {
//       document.removeEventListener("visibilitychange", restartIfEnabled);
//       window.removeEventListener("focus", restartIfEnabled);
//     };
//   }, [wakeEnabled, safeRestartWake, stopWake]);

//   useEffect(() => {
//     return () => {
//       stopWake();
//       stopCommand();
//       synth.current.cancel();
//     };
//   }, [stopWake, stopCommand]);

// return (
//   <ThemeProvider theme={getTheme(mode)}>
//     <CssBaseline />

//     <Container
//       maxWidth="xl"
//       sx={{
//         mt: 3,
//         mb: 5,
//         display: "flex",
//         justifyContent: "center",
//       }}
//     >
//       <Grid container spacing={4}>

//         {/* LEFT PANEL */}
//         <Grid item xs={12} md={5}>
//           <Paper
//             elevation={8}
//             sx={{
//               p: 4,
//               borderRadius: 5,
//               backdropFilter: "blur(12px)",
//               background:
//                 mode === "light"
//                   ? "rgba(255,255,255,0.85)"
//                   : "rgba(30,30,30,0.6)",
//               boxShadow: "0 8px 28px rgba(0,0,0,0.15)",
//             }}
//           >
//             {/* HEADER */}
//             <Box
//               sx={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 mb: 3,
//                 alignItems: "center",
//               }}
//             >
//               <Box>
//                 <Typography
//                   variant="subtitle1"
//                   sx={{ fontWeight: "bold", letterSpacing: 0.5 }}
//                 >
//                   Wake Status
//                 </Typography>
//                 <Typography
//                   variant="h6"
//                   sx={{
//                     fontWeight: "bold",
//                     color:
//                       wakeEnabled && wakeStatus === "listening"
//                         ? "green"
//                         : wakeEnabled
//                         ? "orange"
//                         : "gray",
//                   }}
//                 >
//                   {wakeEnabled ? wakeStatus : "off"}
//                 </Typography>
//               </Box>

//               <Stack direction="row" spacing={1}>
//                 <IconButton
//                   onClick={() => setMode(mode === "light" ? "dark" : "light")}
//                   sx={{
//                     bgcolor: "background.paper",
//                     borderRadius: 3,
//                     p: 1.2,
//                     boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
//                   }}
//                 >
//                   {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
//                 </IconButton>

//                 <Button
//                   variant={wakeEnabled ? "contained" : "outlined"}
//                   startIcon={<PowerSettingsNewIcon />}
//                   onClick={toggleWake}
//                   sx={{
//                     borderRadius: 3,
//                     textTransform: "none",
//                     px: 2,
//                     fontWeight: "bold",
//                   }}
//                 >
//                   {wakeEnabled ? "Disable" : "Enable"}
//                 </Button>
//               </Stack>
//             </Box>

//             {/* TITLE */}
//             <Typography
//               variant="h4"
//               align="center"
//               sx={{
//                 fontWeight: 900,
//                 mb: 4,
//                 letterSpacing: 1,
//                 opacity: 0.9,
//               }}
//             >
//               Voice Assistant
//             </Typography>

//             {/* CHECKLIST CARD */}
//             <Paper
//               elevation={0}
//               sx={{
//                 p: 3,
//                 mb: 3,
//                 borderRadius: 4,
//                 background:
//                   mode === "light"
//                     ? "rgba(245,245,245,0.8)"
//                     : "rgba(255,255,255,0.06)",
//                 border: "1px solid rgba(255,255,255,0.1)",
//               }}
//             >
//               <Typography
//                 variant="h6"
//                 sx={{ fontWeight: "bold", mb: 2, opacity: 0.9 }}
//               >
//                 Usage Checklist
//               </Typography>

//               {[
//                 ["Init Microphone", initialized],
//                 ["Wake Word Enabled", wakeEnabled],
//                 [
//                   "Listening for Wake Word",
//                   wakeEnabled && wakeStatus === "listening",
//                 ],
//                 ["Wake Word Detected", wakeStatus === "paused"],
//                 ["Listening for Command", listening],
//                 ["Response Generated", response.trim()],
//                 ["Command Entered", query.trim()],
//               ].map(([label, flag], i) => (
//                 <Typography
//                   key={i}
//                   variant="body1"
//                   sx={{
//                     mb: 1,
//                     display: "flex",
//                     gap: 1,
//                     alignItems: "center",
//                     color: flag ? "green" : "text.secondary",
//                     fontWeight: flag ? "600" : "400",
//                   }}
//                 >
//                   {flag ? "✓" : "○"} {label}
//                 </Typography>
//               ))}
//             </Paper>

//             {/* INPUT BOX */}
//             <Box
//               sx={{
//                 display: "flex",
//                 gap: 2,
//                 mb: 3,
//                 alignItems: "center",
//               }}
//             >
//               <TextField
//                 fullWidth
//                 label="Type or speak a command"
//                 value={query}
//                 onChange={(e) => setQuery(e.target.value)}
//                 onKeyPress={(e) => e.key === "Enter" && handleSendQuery()}
//                 sx={{
//                   "& .MuiOutlinedInput-root": {
//                     borderRadius: 3,
//                   },
//                 }}
//               />

//               <Button
//                 variant="contained"
//                 onClick={handleSendQuery}
//                 sx={{
//                   borderRadius: 3,
//                   p: 2,
//                   minWidth: "56px",
//                 }}
//               >
//                 <SendIcon />
//               </Button>
//             </Box>

//             {/* CONTROL BUTTONS */}
//             <Stack
//               direction="row"
//               spacing={2}
//               justifyContent="center"
//               sx={{ mb: 3 }}
//             >
//               <Button
//                 variant={listening ? "outlined" : "contained"}
//                 color={listening ? "secondary" : "primary"}
//                 onClick={handleManualSpeak}
//                 startIcon={<MicIcon />}
//                 disabled={!initialized}
//                 sx={{
//                   borderRadius: 3,
//                   px: 3,
//                   fontWeight: "bold",
//                 }}
//               >
//                 {listening ? "Listening..." : "Speak"}
//               </Button>

//               <Button
//                 variant="outlined"
//                 color="error"
//                 onClick={handleStopAll}
//                 startIcon={<StopIcon />}
//                 sx={{ borderRadius: 3, px: 3 }}
//               >
//                 Stop
//               </Button>

//               <Button
//                 variant="outlined"
//                 color="info"
//                 onClick={initMicrophone}
//                 startIcon={<MicIcon />}
//                 disabled={initialized}
//                 sx={{ borderRadius: 3, px: 3 }}
//               >
//                 {initialized ? "Mic Ready" : "Init Mic"}
//               </Button>

//               <Button
//                 variant="outlined"
//                 color="warning"
//                 onClick={handleReset}
//                 startIcon={<ClearAllIcon />}
//                 sx={{ borderRadius: 3, px: 3 }}
//               >
//                 Reset
//               </Button>
//             </Stack>

//             {/* RESPONSE BOX */}
//             <Paper
//               elevation={1}
//               sx={{
//                 p: 3,
//                 minHeight: 160,
//                 borderRadius: 4,
//                 background:
//                   mode === "light"
//                     ? "rgba(250,250,250,0.9)"
//                     : "rgba(255,255,255,0.08)",
//               }}
//             >
//               <Typography variant="subtitle1" fontWeight="bold">
//                 Response:
//               </Typography>

//               <Typography
//                 variant="body1"
//                 sx={{
//                   mt: 1,
//                   whiteSpace: "pre-wrap",
//                   opacity: 0.9,
//                 }}
//               >
//                 {response}
//               </Typography>
//             </Paper>
//           </Paper>
//         </Grid>

//         {/* RIGHT PANEL */}
//         <Grid item xs={12} md={7}>
//           <MemoizedCommandsList />
//         </Grid>
//       </Grid>
//     </Container>
//   </ThemeProvider>
// );
// }





















// import React, {
//   useEffect,
//   useRef,
//   useState,
//   useCallback,
//   useMemo,
// } from "react";
// import { sendQuery } from "./api";

// import Container from "@mui/material/Container";
// import Typography from "@mui/material/Typography";
// import TextField from "@mui/material/TextField";
// import Button from "@mui/material/Button";
// import Box from "@mui/material/Box";
// import Paper from "@mui/material/Paper";
// import Grid from "@mui/material/Grid";
// import Stack from "@mui/material/Stack";
// import IconButton from "@mui/material/IconButton";

// import MicIcon from "@mui/icons-material/Mic";
// import SendIcon from "@mui/icons-material/Send";
// import StopIcon from "@mui/icons-material/Stop";
// import ClearAllIcon from "@mui/icons-material/ClearAll";
// import DarkModeIcon from "@mui/icons-material/DarkMode";
// import LightModeIcon from "@mui/icons-material/LightMode";
// import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";

// import { ThemeProvider, CssBaseline } from "@mui/material";
// import { getTheme } from "./theme";
// import CommandsList from "./CommandsList";

// const MemoizedCommandsList = React.memo(CommandsList);

// // Wrap the component in React.memo for potential parent re-render prevention
// function App() {
//   const [mode, setMode] = useState("light");
//   const [query, setQuery] = useState("");
//   const [response, setResponse] = useState("");
//   const [listening, setListening] = useState(false);
//   const [wakeEnabled, setWakeEnabled] = useState(false);
//   const [wakeStatus, setWakeStatus] = useState("stopped");
//   const [initialized, setInitialized] = useState(false);

//   const SpeechRecognition = useMemo(
//     () => window.SpeechRecognition || window.webkitSpeechRecognition || null,
//     []
//   );
//   const wakeRef = useRef(null);
//   const cmdRef = useRef(null);
//   const lastWakeTime = useRef(0);
//   const WAKE_DELAY = 1800;
//   const wakeWords = useMemo(
//     () => ["hey google", "okay google", "hey assistant", "hello assistant"],
//     []
//   );
//   const synth = useRef(window.speechSynthesis);

//   const canStartWake = useCallback(() => {
//     return (
//       !synth.current.speaking &&
//       !listening &&
//       !wakeRef.current
//     );
//   }, [listening]);

//   const speakAndWait = useCallback((text) => {
//     return new Promise((resolve) => {
//       try {
//         if (!synth.current) return resolve();

//         if (synth.current.speaking) {
//           synth.current.cancel();
//         }

//         const u = new SpeechSynthesisUtterance(text || "");
//         u.onend = () => {
//           resolve();
//         };
//         u.onerror = () => {
//           resolve();
//         };
//         synth.current.speak(u);
//       } catch (e) {
//         resolve();
//       }
//     });
//   }, []);

//   const initMicrophone = useCallback(async () => {
//     try {
//       await navigator.mediaDevices.getUserMedia({ audio: true });
//       setInitialized(true);
//     } catch (e) {
//       alert("Microphone access required. Allow mic and retry Init.");
//     }
//   }, []);

//   const stopCommand = useCallback(() => {
//     if (cmdRef.current) {
//       try {
//         cmdRef.current.onresult = null;
//         cmdRef.current.onend = null;
//         cmdRef.current.onerror = null;
//         cmdRef.current.stop();
//       } catch (e) {
//         console.warn("stopCommand error:", e);
//       }
//     }
//     cmdRef.current = null;
//     setListening(false);
//   }, []);

//   const stopWake = useCallback(() => {
//     if (wakeRef.current) {
//       try {
//         wakeRef.current.onresult = null;
//         wakeRef.current.onend = null;
//         wakeRef.current.onerror = null;
//         wakeRef.current.stop();
//       } catch (e) {
//         console.warn("stopWake error:", e);
//       }
//     }
//     wakeRef.current = null;
//     setWakeStatus("stopped");
//   }, []);

//   let startWake;

//   const safeRestartWake = useCallback(() => {
//     setTimeout(() => {
//       let attempts = 0;

//       const tryStart = () => {
//         if (canStartWake()) {
//           wakeRef.current = null;
//           // IMPORTANT: startWake is defined later, making this dependency fragile.
//           // In a proper application, startWake should be defined before safeRestartWake.
//           // Assuming the function execution works due to closure scope:
//           if (startWake) {
//               startWake();
//           }
//         } else {
//           attempts++;
//           if (attempts < 10) {
//             setTimeout(tryStart, 200);
//           }
//         }
//       };
//       tryStart();
//     }, WAKE_DELAY);
//   }, [canStartWake]);

//   const startCommand = useCallback(() => {
//     if (!SpeechRecognition) {
//       alert("SpeechRecognition not supported in this browser.");
//       return;
//     }

//     stopCommand();

//     const r = new SpeechRecognition();
//     r.lang = "en-US";
//     r.interimResults = false;
//     r.continuous = false;

//     r.onstart = () => {
//       setListening(true);
//     };

//     r.onresult = async (e) => {
//       const transcript = e.results[0][0].transcript.trim();
//       setQuery(transcript);

//       try {
//         const res = await sendQuery(transcript);
//         setResponse(res);
//         await speakAndWait(res);
//       } catch (err) {
//         console.error("onresult error:", err);
//       }
//     };

//     r.onerror = () => {
//       if (wakeEnabled) safeRestartWake();
//     };

//     r.onend = () => {
//       setListening(false);
//       if (wakeEnabled) safeRestartWake();
//     };

//     try {
//       r.start();
//       cmdRef.current = r;
//     } catch (e) {
//       if (wakeEnabled) safeRestartWake();
//     }
//   }, [SpeechRecognition, stopCommand, speakAndWait, wakeEnabled, safeRestartWake]);

//   startWake = useCallback(() => {
//     if (!SpeechRecognition) return;
//     if (wakeRef.current) return;

//     const wr = new SpeechRecognition();
//     wr.lang = "en-US";
//     wr.interimResults = true;
//     wr.continuous = true;

//     wr.onstart = () => {
//       setWakeStatus("listening");
//     };

//     wr.onresult = (event) => {
//       let transcript = "";
//       for (let i = event.resultIndex; i < event.results.length; i++) {
//         transcript += event.results[i][0].transcript;
//       }
//       transcript = transcript.toLowerCase().trim();

//       const last = event.results[event.results.length - 1];
//       if (!last.isFinal) return;

//       if (Date.now() - lastWakeTime.current < 2000) return;

//       const found = wakeWords.some((w) => transcript.includes(w));
//       if (!found) return;

//       lastWakeTime.current = Date.now();

//       try {
//         wr.onresult = null;
//         wr.onend = null;
//         wr.onerror = null;
//         wr.stop();
//       } catch { }

//       wakeRef.current = null;
//       setWakeStatus("paused");

//       (async () => {
//         await speakAndWait("Yes?");
//         setTimeout(() => startCommand(), 200);
//       })();
//     };

//     wr.onerror = () => {
//       setWakeStatus("error");
//       if (wakeEnabled) safeRestartWake();
//     };

//     wr.onend = () => {
//       wakeRef.current = null;
//       setWakeStatus("stopped");
//       if (wakeEnabled) safeRestartWake();
//     };

//     try {
//       wr.start();
//       wakeRef.current = wr;
//     } catch {
//       setWakeStatus("error");
//       if (wakeEnabled) safeRestartWake();
//     }
//   }, [SpeechRecognition, wakeWords, speakAndWait, startCommand, safeRestartWake, wakeEnabled]);

//   const toggleWake = useCallback(() => {
//     if (!initialized) {
//       alert("Press Init Microphone first.");
//       return;
//     }
//     if (!wakeEnabled) {
//       setWakeEnabled(true);
//       wakeRef.current = null;
//       safeRestartWake();
//     } else {
//       setWakeEnabled(false);
//       stopWake();
//     }
//   }, [initialized, wakeEnabled, safeRestartWake, stopWake]);

//   const handleSendQuery = useCallback(async () => {
//     if (!query.trim()) return;
//     const res = await sendQuery(query);
//     setResponse(res);
//     await speakAndWait(res);
//   }, [query, speakAndWait]);

//   const handleManualSpeak = useCallback(() => {
//     if (!initialized) return alert("Press Init Microphone first.");
//     stopWake();
//     startCommand();
//   }, [initialized, startCommand, stopWake]);

//   const handleStopAll = useCallback(() => {
//     stopCommand();
//     stopWake();
//     setWakeEnabled(false);
//   }, [stopCommand, stopWake]);

//   const handleReset = useCallback(() => {
//     handleStopAll();
//     setQuery("");
//     setResponse("");
//     setInitialized(false);
//     console.clear();
//   }, [handleStopAll]);

//   useEffect(() => {
//     const restartIfEnabled = () => {
//       if (wakeEnabled) {
//         if (wakeRef.current) stopWake();
//         safeRestartWake();
//       }
//     };
//     document.addEventListener("visibilitychange", restartIfEnabled);
//     window.addEventListener("focus", restartIfEnabled);
//     return () => {
//       document.removeEventListener("visibilitychange", restartIfEnabled);
//       window.removeEventListener("focus", restartIfEnabled);
//     };
//   }, [wakeEnabled, safeRestartWake, stopWake]);

//   useEffect(() => {
//     return () => {
//       stopWake();
//       stopCommand();
//       synth.current.cancel();
//     };
//   }, [stopWake, stopCommand]);

//   // Use useMemo for the checklist array to prevent re-creation on every render
//   const CHECKLIST_ITEMS = useMemo(() => [
//     ["Init Microphone", initialized],
//     ["Wake Word Enabled", wakeEnabled],
//     [
//       "Listening for Wake Word",
//       wakeEnabled && wakeStatus === "listening",
//     ],
//     ["Wake Word Detected", wakeStatus === "paused"],
//     ["Listening for Command", listening],
//     ["Response Generated", response.trim()],
//     ["Command Entered", query.trim()],
//   ], [initialized, wakeEnabled, wakeStatus, listening, response, query]);


// return (
//   <ThemeProvider theme={getTheme(mode)}>
//     <CssBaseline />

//     <Container
//       maxWidth="xl"
//       sx={{
//         mt: 3,
//         mb: 5,
//         display: "flex",
//         justifyContent: "center",
//       }}
//     >
//       <Grid container spacing={4}>

//         {/* LEFT PANEL */}
//         <Grid item xs={12} md={5}>
//           <Paper
//             elevation={8}
//             sx={{
//               p: 4,
//               borderRadius: 5,
//               backdropFilter: "blur(12px)",
//               background:
//                 mode === "light"
//                   ? "rgba(255,255,255,0.85)"
//                   : "rgba(30,30,30,0.6)",
//               boxShadow: "0 8px 28px rgba(0,0,0,0.15)",
//             }}
//           >
//             {/* HEADER */}
//             <Box
//               sx={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 mb: 3,
//                 alignItems: "center",
//               }}
//             >
//               <Box>
//                 <Typography
//                   variant="subtitle1"
//                   sx={{ fontWeight: "bold", letterSpacing: 0.5 }}
//                 >
//                   Wake Status
//                 </Typography>
//                 <Typography
//                   variant="h6"
//                   sx={{
//                     fontWeight: "bold",
//                     color:
//                       wakeEnabled && wakeStatus === "listening"
//                         ? "green"
//                         : wakeEnabled
//                         ? "orange"
//                         : "gray",
//                   }}
//                 >
//                   {wakeEnabled ? wakeStatus : "off"}
//                 </Typography>
//               </Box>

//               <Stack direction="row" spacing={1}>
//                 <IconButton
//                   onClick={() => setMode(mode === "light" ? "dark" : "light")}
//                   sx={{
//                     bgcolor: "background.paper",
//                     borderRadius: 3,
//                     p: 1.2,
//                     boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
//                   }}
//                 >
//                   {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
//                 </IconButton>

//                 <Button
//                   variant={wakeEnabled ? "contained" : "outlined"}
//                   startIcon={<PowerSettingsNewIcon />}
//                   onClick={toggleWake}
//                   sx={{
//                     borderRadius: 3,
//                     textTransform: "none",
//                     px: 2,
//                     fontWeight: "bold",
//                   }}
//                 >
//                   {wakeEnabled ? "Disable" : "Enable"}
//                 </Button>
//               </Stack>
//             </Box>

//             {/* TITLE */}
//             <Typography
//               variant="h4"
//               align="center"
//               sx={{
//                 fontWeight: 900,
//                 mb: 4,
//                 letterSpacing: 1,
//                 opacity: 0.9,
//               }}
//             >
//               Voice Assistant
//             </Typography>

//             {/* CHECKLIST CARD (Uses memoized array) */}
//             <Paper
//               elevation={0}
//               sx={{
//                 p: 3,
//                 mb: 3,
//                 borderRadius: 4,
//                 background:
//                   mode === "light"
//                     ? "rgba(245,245,245,0.8)"
//                     : "rgba(255,255,255,0.06)",
//                 border: "1px solid rgba(255,255,255,0.1)",
//               }}
//             >
//               <Typography
//                 variant="h6"
//                 sx={{ fontWeight: "bold", mb: 2, opacity: 0.9 }}
//               >
//                 Usage Checklist
//               </Typography>

//               {CHECKLIST_ITEMS.map(([label, flag], i) => (
//                 <Typography
//                   key={i}
//                   variant="body1"
//                   sx={{
//                     mb: 1,
//                     display: "flex",
//                     gap: 1,
//                     alignItems: "center",
//                     color: flag ? "green" : "text.secondary",
//                     fontWeight: flag ? "600" : "400",
//                   }}
//                 >
//                   {flag ? "✓" : "○"} {label}
//                 </Typography>
//               ))}
//             </Paper>

//             {/* INPUT BOX */}
//             <Box
//               sx={{
//                 display: "flex",
//                 gap: 2,
//                 mb: 3,
//                 alignItems: "center",
//               }}
//             >
//               <TextField
//                 fullWidth
//                 label="Type or speak a command"
//                 value={query}
//                 onChange={(e) => setQuery(e.target.value)}
//                 // Use memoized handler directly
//                 onKeyPress={(e) => {
//                     if (e.key === "Enter") {
//                         handleSendQuery();
//                     }
//                 }}
//                 sx={{
//                   "& .MuiOutlinedInput-root": {
//                     borderRadius: 3,
//                   },
//                 }}
//               />

//               <Button
//                 variant="contained"
//                 onClick={handleSendQuery}
//                 sx={{
//                   borderRadius: 3,
//                   p: 2,
//                   minWidth: "56px",
//                 }}
//               >
//                 <SendIcon />
//               </Button>
//             </Box>

//             {/* CONTROL BUTTONS */}
//             <Stack
//               direction="row"
//               spacing={2}
//               justifyContent="center"
//               sx={{ mb: 3 }}
//             >
//               <Button
//                 variant={listening ? "outlined" : "contained"}
//                 color={listening ? "secondary" : "primary"}
//                 onClick={handleManualSpeak}
//                 startIcon={<MicIcon />}
//                 disabled={!initialized}
//                 sx={{
//                   borderRadius: 3,
//                   px: 3,
//                   fontWeight: "bold",
//                 }}
//               >
//                 {listening ? "Listening..." : "Speak"}
//               </Button>

//               <Button
//                 variant="outlined"
//                 color="error"
//                 onClick={handleStopAll}
//                 startIcon={<StopIcon />}
//                 sx={{ borderRadius: 3, px: 3 }}
//               >
//                 Stop
//               </Button>

//               <Button
//                 variant="outlined"
//                 color="info"
//                 onClick={initMicrophone}
//                 startIcon={<MicIcon />}
//                 disabled={initialized}
//                 sx={{ borderRadius: 3, px: 3 }}
//               >
//                 {initialized ? "Mic Ready" : "Init Mic"}
//               </Button>

//               <Button
//                 variant="outlined"
//                 color="warning"
//                 onClick={handleReset}
//                 startIcon={<ClearAllIcon />}
//                 sx={{ borderRadius: 3, px: 3 }}
//               >
//                 Reset
//               </Button>
//             </Stack>

//             {/* RESPONSE BOX */}
//             <Paper
//               elevation={1}
//               sx={{
//                 p: 3,
//                 minHeight: 160,
//                 borderRadius: 4,
//                 background:
//                   mode === "light"
//                     ? "rgba(250,250,250,0.9)"
//                     : "rgba(255,255,255,0.08)",
//               }}
//             >
//               <Typography variant="subtitle1" fontWeight="bold">
//                 Response:
//               </Typography>

//               <Typography
//                 variant="body1"
//                 sx={{
//                   mt: 1,
//                   whiteSpace: "pre-wrap",
//                   opacity: 0.9,
//                 }}
//               >
//                 {response}
//               </Typography>
//             </Paper>
//           </Paper>
//         </Grid>

//         {/* RIGHT PANEL */}
//         <Grid item xs={12} md={7}>
//           <MemoizedCommandsList />
//         </Grid>
//       </Grid>
//     </Container>
//   </ThemeProvider>
// );
// }

// export default React.memo(App);













// import React, {
//   useEffect,
//   useRef,
//   useState,
//   useCallback,
//   useMemo,
// } from "react";
// // Assuming you have api.js, theme.js, and CommandsList.js in the same directory
// import { sendQuery } from "./api"; 

// import Container from "@mui/material/Container";
// import Typography from "@mui/material/Typography";
// import TextField from "@mui/material/TextField";
// import Button from "@mui/material/Button";
// import Box from "@mui/material/Box";
// import Paper from "@mui/material/Paper";
// import Grid from "@mui/material/Grid";
// import Stack from "@mui/material/Stack";
// import IconButton from "@mui/material/IconButton";

// import MicIcon from "@mui/icons-material/Mic";
// import SendIcon from "@mui/icons-material/Send";
// import StopIcon from "@mui/icons-material/Stop";
// import ClearAllIcon from "@mui/icons-material/ClearAll";
// import DarkModeIcon from "@mui/icons-material/DarkMode";
// import LightModeIcon from "@mui/icons-material/LightMode";
// import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";

// import { ThemeProvider, CssBaseline } from "@mui/material";
// import { getTheme } from "./theme";
// import CommandsList from "./CommandsList";
// import ChecklistStatus from "./ChecklistStatus"; // <-- Import new component

// const MemoizedCommandsList = React.memo(CommandsList);

// function App() {
//   const [mode, setMode] = useState("light");
//   const [query, setQuery] = useState("");
//   const [response, setResponse] = useState("");
//   const [listening, setListening] = useState(false);
//   const [wakeEnabled, setWakeEnabled] = useState(false);
//   const [wakeStatus, setWakeStatus] = useState("stopped");
//   const [initialized, setInitialized] = useState(false);

//   const SpeechRecognition = useMemo(
//     () => window.SpeechRecognition || window.webkitSpeechRecognition || null,
//     []
//   );
//   const wakeRef = useRef(null);
//   const cmdRef = useRef(null);
//   const lastWakeTime = useRef(0);
//   const WAKE_DELAY = 1800;
//   const wakeWords = useMemo(
//     () => ["hey google", "okay google", "hey assistant", "hello assistant"],
//     []
//   );
//   const synth = useRef(window.speechSynthesis);

//   const canStartWake = useCallback(() => {
//     return (
//       !synth.current.speaking &&
//       !listening &&
//       !wakeRef.current
//     );
//   }, [listening]);

//   const speakAndWait = useCallback((text) => {
//     return new Promise((resolve) => {
//       try {
//         if (!synth.current) return resolve();

//         if (synth.current.speaking) {
//           synth.current.cancel();
//         }

//         const u = new SpeechSynthesisUtterance(text || "");
//         u.onend = () => {
//           resolve();
//         };
//         u.onerror = () => {
//           resolve();
//         };
//         synth.current.speak(u);
//       } catch (e) {
//         resolve();
//       }
//     });
//   }, []);

//   const initMicrophone = useCallback(async () => {
//     try {
//       await navigator.mediaDevices.getUserMedia({ audio: true });
//       setInitialized(true);
//     } catch (e) {
//       alert("Microphone access required. Allow mic and retry Init.");
//     }
//   }, []);

//   const stopCommand = useCallback(() => {
//     if (cmdRef.current) {
//       try {
//         cmdRef.current.onresult = null;
//         cmdRef.current.onend = null;
//         cmdRef.current.onerror = null;
//         cmdRef.current.stop();
//       } catch (e) {
//         console.warn("stopCommand error:", e);
//       }
//     }
//     cmdRef.current = null;
//     setListening(false);
//   }, []);

//   const stopWake = useCallback(() => {
//     if (wakeRef.current) {
//       try {
//         wakeRef.current.onresult = null;
//         wakeRef.current.onend = null;
//         wakeRef.current.onerror = null;
//         wakeRef.current.stop();
//       } catch (e) {
//         console.warn("stopWake error:", e);
//       }
//     }
//     wakeRef.current = null;
//     setWakeStatus("stopped");
//   }, []);

//   let startWake; 

//   const safeRestartWake = useCallback(() => {
//     setTimeout(() => {
//       let attempts = 0;

//       const tryStart = () => {
//         if (canStartWake()) {
//           wakeRef.current = null;
//           if (startWake) { 
//               startWake();
//           }
//         } else {
//           attempts++;
//           if (attempts < 10) {
//             setTimeout(tryStart, 200);
//           }
//         }
//       };
//       tryStart();
//     }, WAKE_DELAY);
//   }, [canStartWake]);

//   const startCommand = useCallback(() => {
//     if (!SpeechRecognition) {
//       alert("SpeechRecognition not supported in this browser.");
//       return;
//     }

//     stopCommand();

//     const r = new SpeechRecognition();
//     r.lang = "en-US";
//     r.interimResults = false;
//     r.continuous = false;

//     r.onstart = () => {
//       setListening(true);
//     };

//     r.onresult = async (e) => {
//       const transcript = e.results[0][0].transcript.trim();
//       setQuery(transcript);

//       try {
//         const res = await sendQuery(transcript);
//         setResponse(res);
//         speakAndWait(res); 
//       } catch (err) {
//         console.error("onresult error:", err);
//       }
//     };

//     r.onerror = () => {
//       if (wakeEnabled) safeRestartWake();
//     };

//     r.onend = () => {
//       setListening(false);
//       if (wakeEnabled) safeRestartWake();
//     };

//     try {
//       r.start();
//       cmdRef.current = r;
//     } catch (e) {
//       if (wakeEnabled) safeRestartWake();
//     }
//   }, [SpeechRecognition, stopCommand, speakAndWait, wakeEnabled, safeRestartWake]);

//   startWake = useCallback(() => {
//     if (!SpeechRecognition) return;
//     if (wakeRef.current) return;

//     const wr = new SpeechRecognition();
//     wr.lang = "en-US";
//     wr.interimResults = true;
//     wr.continuous = true;

//     wr.onstart = () => {
//       setWakeStatus("listening");
//     };

//     wr.onresult = (event) => {
//       let transcript = "";
//       for (let i = event.resultIndex; i < event.results.length; i++) {
//         transcript += event.results[i][0].transcript;
//       }
//       transcript = transcript.toLowerCase().trim();

//       const last = event.results[event.results.length - 1];
//       if (!last.isFinal) return;

//       if (Date.now() - lastWakeTime.current < 2000) return;

//       const found = wakeWords.some((w) => transcript.includes(w));
//       if (!found) return;

//       lastWakeTime.current = Date.now();

//       try {
//         wr.onresult = null;
//         wr.onend = null;
//         wr.onerror = null;
//         wr.stop();
//       } catch { }

//       wakeRef.current = null;
//       setWakeStatus("paused");

//       (async () => {
//         speakAndWait("Yes?"); 
//         setTimeout(() => startCommand(), 200);
//       })();
//     };

//     wr.onerror = () => {
//       setWakeStatus("error");
//       if (wakeEnabled) safeRestartWake();
//     };

//     wr.onend = () => {
//       wakeRef.current = null;
//       setWakeStatus("stopped");
//       if (wakeEnabled) safeRestartWake();
//     };

//     try {
//       wr.start();
//       wakeRef.current = wr;
//     } catch {
//       setWakeStatus("error");
//       if (wakeEnabled) safeRestartWake();
//     }
//   }, [SpeechRecognition, wakeWords, speakAndWait, startCommand, safeRestartWake, wakeEnabled]);

//   const toggleWake = useCallback(() => {
//     if (!initialized) {
//       alert("Press Init Microphone first.");
//       return;
//     }
//     if (!wakeEnabled) {
//       setWakeEnabled(true);
//       wakeRef.current = null;
//       safeRestartWake();
//     } else {
//       setWakeEnabled(false);
//       stopWake();
//     }
//   }, [initialized, wakeEnabled, safeRestartWake, stopWake]);

//   const handleSendQuery = useCallback(async () => {
//     if (!query.trim()) return;
//     const res = await sendQuery(query);
//     setResponse(res);
//     speakAndWait(res); 
//   }, [query, speakAndWait]);

//   const handleManualSpeak = useCallback(() => {
//     if (!initialized) return alert("Press Init Microphone first.");
//     stopWake();
//     startCommand();
//   }, [initialized, startCommand, stopWake]);

//   const handleStopAll = useCallback(() => {
//     stopCommand();
//     stopWake();
//     setWakeEnabled(false);
//   }, [stopCommand, stopWake]);

//   const handleReset = useCallback(() => {
//     handleStopAll();
//     setQuery("");
//     setResponse("");
//     setInitialized(false);
//     console.clear();
//   }, [handleStopAll]);

//   useEffect(() => {
//     const restartIfEnabled = () => {
//       if (wakeEnabled) {
//         if (wakeRef.current) stopWake();
//         safeRestartWake();
//       }
//     };
//     document.addEventListener("visibilitychange", restartIfEnabled);
//     window.addEventListener("focus", restartIfEnabled);
//     return () => {
//       document.removeEventListener("visibilitychange", restartIfEnabled);
//       window.removeEventListener("focus", restartIfEnabled);
//     };
//   }, [wakeEnabled, safeRestartWake, stopWake]);

//   useEffect(() => {
//     return () => {
//       stopWake();
//       stopCommand();
//       if (synth.current) {
//         synth.current.cancel();
//       }
//     };
//   }, [stopWake, stopCommand]);

//   const CHECKLIST_ITEMS = useMemo(() => [
//     ["Init Microphone", initialized],
//     ["Wake Word Enabled", wakeEnabled],
//     [
//       "Listening for Wake Word",
//       wakeEnabled && wakeStatus === "listening",
//     ],
//     ["Wake Word Detected", wakeStatus === "paused"],
//     ["Listening for Command", listening],
//     ["Response Generated", response.trim()],
//     ["Command Entered", query.trim()],
//   ], [initialized, wakeEnabled, wakeStatus, listening, response, query]);


// return (
//   <ThemeProvider theme={getTheme(mode)}>
//     <CssBaseline />

//     <Container
//       maxWidth="xl"
//       sx={{
//         mt: 1,
//         mb: 5,
//         display: "flex",
//         justifyContent: "center",
//       }}
//     >
//       <Grid container spacing={4}>

//         <Grid item xs={12} md={5}>
//           <Paper
//             elevation={8}
//             sx={{
//               p: 2,
//               borderRadius: 5,
//               backdropFilter: "blur(12px)",
//               background:
//                 mode === "light"
//                   ? "rgba(255,255,255,0.85)"
//                   : "rgba(30,30,30,0.6)",
//               boxShadow: "0 8px 28px rgba(0,0,0,0.15)",
//             }}
//           >
//             <Box
//               sx={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 mb: 1,
//                 alignItems: "center",
//               }}
//             >
//               <Box>
//                 <Typography
//                   variant="subtitle1"
//                   sx={{ fontWeight: "bold", letterSpacing: 0.5 }}
//                 >
//                   Wake Status
//                 </Typography>
//                 <Typography
//                   variant="h6"
//                   sx={{
//                     fontWeight: "bold",
//                     color:
//                       wakeEnabled && wakeStatus === "listening"
//                         ? "green"
//                         : wakeEnabled
//                         ? "orange"
//                         : "gray",
//                   }}
//                 >
//                   {wakeEnabled ? wakeStatus : "off"}
//                 </Typography>
//               </Box>

//               <Stack direction="row" spacing={1}>
//                 <IconButton
//                   onClick={() => setMode(mode === "light" ? "dark" : "light")}
//                   sx={{
//                     bgcolor: "background.paper",
//                     borderRadius: 3,
//                     p: 1.2,
//                     boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
//                   }}
//                 >
//                   {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
//                 </IconButton>

//                 <Button
//                   variant={wakeEnabled ? "contained" : "outlined"}
//                   startIcon={<PowerSettingsNewIcon />}
//                   onClick={toggleWake}
//                   sx={{
//                     borderRadius: 3,
//                     textTransform: "none",
//                     px: 2,
//                     fontWeight: "bold",
//                   }}
//                 >
//                   {wakeEnabled ? "Disable" : "Enable"}
//                 </Button>
//               </Stack>
//             </Box>

//             <Typography
//               variant="h4"
//               align="center"
//               sx={{
//                 fontWeight: 900,
//                 mb: 0,
//                 letterSpacing: 1,
//                 opacity: 0.9,
//               }}
//             >
//               Voice Assistant
//             </Typography>

//             <ChecklistStatus mode={mode} checklistItems={CHECKLIST_ITEMS} />

//             <Box
//               sx={{
//                 display: "flex",
//                 gap: 2,
//                 mb: 1,
//                 alignItems: "center",
//               }}
//             >
//               <TextField
//                 fullWidth
//                 label="Type or speak a command"
//                 value={query}
//                 onChange={(e) => setQuery(e.target.value)}
//                 onKeyPress={(e) => {
//                     if (e.key === "Enter") {
//                         handleSendQuery();
//                     }
//                 }}
//                 sx={{
//                   "& .MuiOutlinedInput-root": {
//                     borderRadius: 3,
//                   },
//                 }}
//               />

//               <Button
//                 variant="contained"
//                 onClick={handleSendQuery}
//                 sx={{
//                   borderRadius: 3,
//                   p: 2,
//                   minWidth: "56px",
//                 }}
//               >
//                 <SendIcon />
//               </Button>
//             </Box>

//             <Stack
//               direction="row"
//               spacing={2}
//               justifyContent="center"
//               sx={{ mb: 3 }}
//             >
//               <Button
//                 variant={listening ? "outlined" : "contained"}
//                 color={listening ? "secondary" : "primary"}
//                 onClick={handleManualSpeak}
//                 startIcon={<MicIcon />}
//                 disabled={!initialized}
//                 sx={{
//                   borderRadius: 3,
//                   px: 3,
//                   fontWeight: "bold",
//                 }}
//               >
//                 {listening ? "Listening..." : "Speak"}
//               </Button>

//               <Button
//                 variant="outlined"
//                 color="error"
//                 onClick={handleStopAll}
//                 startIcon={<StopIcon />}
//                 sx={{ borderRadius: 3, px: 3 }}
//               >
//                 Stop
//               </Button>

//               <Button
//                 variant="outlined"
//                 color="info"
//                 onClick={initMicrophone}
//                 startIcon={<MicIcon />}
//                 disabled={initialized}
//                 sx={{ borderRadius: 3, px: 3 }}
//               >
//                 {initialized ? "Mic Ready" : "Init Mic"}
//               </Button>

//               <Button
//                 variant="outlined"
//                 color="warning"
//                 onClick={handleReset}
//                 startIcon={<ClearAllIcon />}
//                 sx={{ borderRadius: 3, px: 3 }}
//               >
//                 Reset
//               </Button>
//             </Stack>

//             <Paper
//               elevation={1}
//               sx={{
//                 p: 3,
//                 minHeight: 160,
//                 borderRadius: 4,
//                 background:
//                   mode === "light"
//                     ? "rgba(250,250,250,0.9)"
//                     : "rgba(255,255,255,0.08)",
//               }}
//             >
//               <Typography variant="subtitle1" fontWeight="bold">
//                 Response:
//               </Typography>

//               <Typography
//                 variant="body1"
//                 sx={{
//                   mt: 1,
//                   whiteSpace: "pre-wrap",
//                   opacity: 0.9,
//                 }}
//               >
//                 {response}
//               </Typography>
//             </Paper>
//           </Paper>
//         </Grid>

//         <Grid item xs={12} md={7}>
//           <MemoizedCommandsList />
//         </Grid>
//       </Grid>
//     </Container>
//   </ThemeProvider>
// );
// }

// export default React.memo(App);

















// import React, {
//   useEffect,
//   useRef,
//   useState,
//   useCallback,
//   useMemo,
// } from "react";
// import { sendQuery } from "./api";

// import {
//   Container,
//   Typography,
//   TextField,
//   Button,
//   Box,
//   Paper,
//   Grid,
//   Stack,
//   IconButton,
//   Chip,
// } from "@mui/material";

// import MicIcon from "@mui/icons-material/Mic";
// import SendIcon from "@mui/icons-material/Send";
// import StopIcon from "@mui/icons-material/Stop";
// import ClearAllIcon from "@mui/icons-material/ClearAll";
// import DarkModeIcon from "@mui/icons-material/DarkMode";
// import LightModeIcon from "@mui/icons-material/LightMode";
// import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";

// import { ThemeProvider, CssBaseline } from "@mui/material";
// import { getTheme } from "./theme";
// import CommandsList from "./CommandsList";
// import ChecklistStatus from "./ChecklistStatus";

// const MemoizedCommandsList = React.memo(CommandsList);

// function App() {
//   const [mode, setMode] = useState("light");
//   const [query, setQuery] = useState("");
//   const [response, setResponse] = useState("");
//   const [listening, setListening] = useState(false);
//   const [wakeEnabled, setWakeEnabled] = useState(false);
//   const [wakeStatus, setWakeStatus] = useState("stopped");
//   const [initialized, setInitialized] = useState(false);

//   const SpeechRecognition = useMemo(
//     () => window.SpeechRecognition || window.webkitSpeechRecognition || null,
//     []
//   );

//   const wakeRef = useRef(null);
//   const cmdRef = useRef(null);
//   const lastWakeTime = useRef(0);
//   const WAKE_DELAY = 1800;

//   const wakeWords = useMemo(
//     () => ["hey google", "okay google", "hey assistant", "hello assistant"],
//     []
//   );

//   const synth = useRef(window.speechSynthesis);

//   const canStartWake = useCallback(() => {
//     return !synth.current.speaking && !listening && !wakeRef.current;
//   }, [listening]);

//   const speakAndWait = useCallback((text) => {
//     return new Promise((resolve) => {
//       try {
//         if (!synth.current) return resolve();
//         if (synth.current.speaking) synth.current.cancel();

//         const u = new SpeechSynthesisUtterance(text || "");
//         u.onend = () => resolve();
//         u.onerror = () => resolve();
//         synth.current.speak(u);
//       } catch {
//         resolve();
//       }
//     });
//   }, []);

//   const initMicrophone = useCallback(async () => {
//     try {
//       await navigator.mediaDevices.getUserMedia({ audio: true });
//       setInitialized(true);
//     } catch {
//       alert("Microphone access required. Allow mic and retry Init.");
//     }
//   }, []);

//   const stopCommand = useCallback(() => {
//     if (cmdRef.current) {
//       try {
//         cmdRef.current.onresult = null;
//         cmdRef.current.onend = null;
//         cmdRef.current.onerror = null;
//         cmdRef.current.stop();
//       } catch {}
//     }
//     cmdRef.current = null;
//     setListening(false);
//   }, []);

//   const stopWake = useCallback(() => {
//     if (wakeRef.current) {
//       try {
//         wakeRef.current.onresult = null;
//         wakeRef.current.onend = null;
//         wakeRef.current.onerror = null;
//         wakeRef.current.stop();
//       } catch {}
//     }
//     wakeRef.current = null;
//     setWakeStatus("stopped");
//   }, []);

//   let startWake;

//   const safeRestartWake = useCallback(() => {
//     setTimeout(() => {
//       let attempts = 0;

//       const tryStart = () => {
//         if (canStartWake()) {
//           wakeRef.current = null;
//           if (startWake) startWake();
//         } else if (attempts < 10) {
//           attempts++;
//           setTimeout(tryStart, 200);
//         }
//       };

//       tryStart();
//     }, WAKE_DELAY);
//   }, [canStartWake]);

//   const startCommand = useCallback(() => {
//     if (!SpeechRecognition) return alert("SpeechRecognition not supported.");

//     stopCommand();

//     const r = new SpeechRecognition();
//     r.lang = "en-US";
//     r.interimResults = false;
//     r.continuous = false;

//     r.onstart = () => setListening(true);

//     r.onresult = async (e) => {
//       const transcript = e.results[0][0].transcript.trim();
//       setQuery(transcript);

//       try {
//         const res = await sendQuery(transcript);
//         setResponse(res);
//         speakAndWait(res);
//       } catch {}
//     };

//     r.onerror = () => {
//       if (wakeEnabled) safeRestartWake();
//     };

//     r.onend = () => {
//       setListening(false);
//       if (wakeEnabled) safeRestartWake();
//     };

//     try {
//       r.start();
//       cmdRef.current = r;
//     } catch {
//       if (wakeEnabled) safeRestartWake();
//     }
//   }, [SpeechRecognition, stopCommand, speakAndWait, wakeEnabled, safeRestartWake]);

//   startWake = useCallback(() => {
//     if (!SpeechRecognition) return;
//     if (wakeRef.current) return;

//     const wr = new SpeechRecognition();
//     wr.lang = "en-US";
//     wr.interimResults = true;
//     wr.continuous = true;

//     wr.onstart = () => setWakeStatus("listening");

//     wr.onresult = (event) => {
//       let transcript = "";
//       for (let i = event.resultIndex; i < event.results.length; i++) {
//         transcript += event.results[i][0].transcript;
//       }
//       transcript = transcript.toLowerCase().trim();

//       const last = event.results[event.results.length - 1];
//       if (!last.isFinal) return;

//       if (Date.now() - lastWakeTime.current < 2000) return;

//       const found = wakeWords.some((w) => transcript.includes(w));
//       if (!found) return;

//       lastWakeTime.current = Date.now();

//       try {
//         wr.onresult = null;
//         wr.onend = null;
//         wr.onerror = null;
//         wr.stop();
//       } catch {}

//       wakeRef.current = null;
//       setWakeStatus("paused");

//       (async () => {
//         speakAndWait("Yes?");
//         setTimeout(() => startCommand(), 200);
//       })();
//     };

//     wr.onerror = () => {
//       setWakeStatus("error");
//       if (wakeEnabled) safeRestartWake();
//     };

//     wr.onend = () => {
//       wakeRef.current = null;
//       setWakeStatus("stopped");
//       if (wakeEnabled) safeRestartWake();
//     };

//     try {
//       wr.start();
//       wakeRef.current = wr;
//     } catch {
//       setWakeStatus("error");
//       if (wakeEnabled) safeRestartWake();
//     }
//   }, [SpeechRecognition, wakeWords, speakAndWait, startCommand, safeRestartWake, wakeEnabled]);

//   const toggleWake = useCallback(() => {
//     if (!initialized) return alert("Press Init Microphone first.");

//     if (!wakeEnabled) {
//       setWakeEnabled(true);
//       wakeRef.current = null;
//       safeRestartWake();
//     } else {
//       setWakeEnabled(false);
//       stopWake();
//     }
//   }, [initialized, wakeEnabled, safeRestartWake, stopWake]);

//   const handleSendQuery = useCallback(async () => {
//     if (!query.trim()) return;
//     const res = await sendQuery(query);
//     setResponse(res);
//     speakAndWait(res);
//   }, [query, speakAndWait]);

//   const handleManualSpeak = useCallback(() => {
//     if (!initialized) return alert("Press Init Microphone first.");
//     stopWake();
//     startCommand();
//   }, [initialized, startCommand, stopWake]);

//   const handleStopAll = useCallback(() => {
//     stopCommand();
//     stopWake();
//     setWakeEnabled(false);
//   }, [stopCommand, stopWake]);

//   const handleReset = useCallback(() => {
//     handleStopAll();
//     setQuery("");
//     setResponse("");
//     setInitialized(false);
//     console.clear();
//   }, [handleStopAll]);

//   useEffect(() => {
//     const restartIfEnabled = () => {
//       if (wakeEnabled) {
//         if (wakeRef.current) stopWake();
//         safeRestartWake();
//       }
//     };
//     document.addEventListener("visibilitychange", restartIfEnabled);
//     window.addEventListener("focus", restartIfEnabled);
//     return () => {
//       document.removeEventListener("visibilitychange", restartIfEnabled);
//       window.removeEventListener("focus", restartIfEnabled);
//     };
//   }, [wakeEnabled, safeRestartWake, stopWake]);

//   useEffect(() => {
//     return () => {
//       stopWake();
//       stopCommand();
//       if (synth.current) synth.current.cancel();
//     };
//   }, [stopWake, stopCommand]);

//   const CHECKLIST_ITEMS = useMemo(
//     () => [
//       ["Init Microphone", initialized],
//       ["Wake Word Enabled", wakeEnabled],
//       ["Listening for Wake Word", wakeEnabled && wakeStatus === "listening"],
//       ["Wake Word Detected", wakeStatus === "paused"],
//       ["Listening for Command", listening],
//       ["Response Generated", response.trim()],
//       ["Command Entered", query.trim()],
//     ],
//     [initialized, wakeEnabled, wakeStatus, listening, response, query]
//   );

//   return (
//     <ThemeProvider theme={getTheme(mode)}>
//       <CssBaseline />

//       <Container
//         maxWidth="xl"
//         sx={{
//           mt: 2,
//           mb: 5,
//         }}
//       >
//         <Grid container spacing={4} justifyContent="center">
//           {/* LEFT PANEL */}
//           <Grid item xs={12} md={5}>
//             <Paper
//               elevation={0}
//               sx={{
//                 p: 3,
//                 borderRadius: "28px",
//                 backdropFilter: "blur(22px)",
//                 background: "rgba(255,255,255,0.55)",
//                 border: "1px solid rgba(255,255,255,0.6)",
//                 boxShadow: "0 8px 30px rgba(0,0,0,0.10)",
//               }}
//             >
//               {/* HEADER */}
//               <Box
//                 sx={{
//                   display: "flex",
//                   justifyContent: "space-between",
//                   mb: 3,
//                   alignItems: "center",
//                 }}
//               >
//                 <Box>
//                   <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
//                     Wake Status
//                   </Typography>

//                   <Chip
//                     label={wakeEnabled ? wakeStatus : "Off"}
//                     sx={{
//                       mt: 0.5,
//                       fontSize: "0.95rem",
//                       fontWeight: "700",
//                       px: 1.5,
//                       py: 0.5,
//                       borderRadius: "14px",
//                       bgcolor: !wakeEnabled
//                         ? "rgba(180,180,180,0.25)"
//                         : wakeStatus === "listening"
//                         ? "rgba(0,200,0,0.25)"
//                         : wakeStatus === "paused"
//                         ? "rgba(255,180,0,0.25)"
//                         : "rgba(150,150,150,0.25)",
//                     }}
//                   />
//                 </Box>

//                 <Stack direction="row" spacing={1}>
//                   <IconButton
//                     onClick={() =>
//                       setMode(mode === "light" ? "dark" : "light")
//                     }
//                     sx={{
//                       backdropFilter: "blur(15px)",
//                       bgcolor: "rgba(255,255,255,0.6)",
//                       borderRadius: "16px",
//                       boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
//                     }}
//                   >
//                     {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
//                   </IconButton>

//                   <Button
//                     variant="contained"
//                     onClick={toggleWake}
//                     startIcon={<PowerSettingsNewIcon />}
//                     sx={{
//                       borderRadius: "16px",
//                       textTransform: "none",
//                       fontWeight: 700,
//                       px: 2,
//                       backdropFilter: "blur(12px)",
//                     }}
//                   >
//                     {wakeEnabled ? "Disable" : "Enable"}
//                   </Button>
//                 </Stack>
//               </Box>

//               {/* TITLE */}
//               <Typography
//                 variant="h4"
//                 align="center"
//                 sx={{
//                   fontWeight: 900,
//                   mb: 2,
//                   letterSpacing: 0.5,
//                 }}
//               >
//                 Voice Assistant
//               </Typography>

//               {/* CHECKLIST */}
//               <ChecklistStatus mode={mode} checklistItems={CHECKLIST_ITEMS} />

//               {/* INPUT + SEND */}
//               <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
//                 <TextField
//                   fullWidth
//                   label="Type or speak a command"
//                   value={query}
//                   onChange={(e) => setQuery(e.target.value)}
//                   onKeyPress={(e) => {
//                     if (e.key === "Enter") handleSendQuery();
//                   }}
//                   sx={{
//                     "& .MuiOutlinedInput-root": {
//                       borderRadius: "16px",
//                       backdropFilter: "blur(14px)",
//                       background: "rgba(255,255,255,0.6)",
//                     },
//                   }}
//                 />

//                 <IconButton
//                   onClick={handleSendQuery}
//                   sx={{
//                     width: 58,
//                     height: 58,
//                     borderRadius: "18px",
//                     bgcolor: "rgba(255,255,255,0.8)",
//                     backdropFilter: "blur(14px)",
//                     boxShadow: "0 4px 18px rgba(0,0,0,0.15)",
//                   }}
//                 >
//                   <SendIcon />
//                 </IconButton>
//               </Box>

//               {/* BUTTONS */}
//               <Stack
//                 direction="row"
//                 spacing={2}
//                 justifyContent="center"
//                 sx={{ mb: 3 }}
//               >
//                 <Button
//                   variant="contained"
//                   onClick={handleManualSpeak}
//                   startIcon={<MicIcon />}
//                   disabled={!initialized}
//                   sx={{
//                     borderRadius: "16px",
//                     px: 3,
//                     textTransform: "none",
//                     fontWeight: 700,
//                   }}
//                 >
//                   {listening ? "Listening..." : "Speak"}
//                 </Button>

//                 <Button
//                   variant="outlined"
//                   color="error"
//                   onClick={handleStopAll}
//                   startIcon={<StopIcon />}
//                   sx={{
//                     borderRadius: "16px",
//                     px: 3,
//                     fontWeight: 600,
//                     backdropFilter: "blur(10px)",
//                     bgcolor: "rgba(255,255,255,0.6)",
//                   }}
//                 >
//                   Stop
//                 </Button>

//                 <Button
//                   variant="outlined"
//                   color="info"
//                   onClick={initMicrophone}
//                   startIcon={<MicIcon />}
//                   disabled={initialized}
//                   sx={{
//                     borderRadius: "16px",
//                     px: 3,
//                     fontWeight: 600,
//                     bgcolor: "rgba(255,255,255,0.6)",
//                     backdropFilter: "blur(10px)",
//                   }}
//                 >
//                   {initialized ? "Mic Ready" : "Init Mic"}
//                 </Button>

//                 <Button
//                   variant="outlined"
//                   color="warning"
//                   onClick={handleReset}
//                   startIcon={<ClearAllIcon />}
//                   sx={{
//                     borderRadius: "16px",
//                     px: 3,
//                     fontWeight: 600,
//                     bgcolor: "rgba(255,255,255,0.6)",
//                     backdropFilter: "blur(10px)",
//                   }}
//                 >
//                   Reset
//                 </Button>
//               </Stack>

//               {/* RESPONSE BOX */}
//               <Paper
//                 elevation={0}
//                 sx={{
//                   p: 3,
//                   borderRadius: "22px",
//                   minHeight: 150,
//                   background: "rgba(255,255,255,0.6)",
//                   border: "1px solid rgba(255,255,255,0.7)",
//                   backdropFilter: "blur(18px)",
//                 }}
//               >
//                 <Typography variant="subtitle1" fontWeight="700">
//                   Response:
//                 </Typography>

//                 <Typography
//                   sx={{
//                     mt: 1,
//                     whiteSpace: "pre-wrap",
//                     opacity: 0.9,
//                   }}
//                 >
//                   {response}
//                 </Typography>
//               </Paper>
//             </Paper>
//           </Grid>

//           {/* RIGHT PANEL */}
//           <Grid item xs={12} md={7}>
//             <MemoizedCommandsList />
//           </Grid>
//         </Grid>
//       </Container>
//     </ThemeProvider>
//   );
// }

// export default React.memo(App);














import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";

import { sendQuery } from "./api";

import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";

import MicIcon from "@mui/icons-material/Mic";
import SendIcon from "@mui/icons-material/Send";
import StopIcon from "@mui/icons-material/Stop";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";

import { ThemeProvider, CssBaseline } from "@mui/material";
import { getTheme } from "./theme";
import CommandsList from "./CommandsList";
import ChecklistStatus from "./ChecklistStatus";

const MemoizedCommandsList = React.memo(CommandsList);

function App() {
  const [mode, setMode] = useState("light");
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [listening, setListening] = useState(false);
  const [wakeEnabled, setWakeEnabled] = useState(false);
  const [wakeStatus, setWakeStatus] = useState("stopped");
  const [initialized, setInitialized] = useState(false);

  // Speech Setup
  const SpeechRecognition = useMemo(
    () => window.SpeechRecognition || window.webkitSpeechRecognition || null,
    []
  );

  const wakeRef = useRef(null);
  const cmdRef = useRef(null);
  const lastWakeTime = useRef(0);
  const WAKE_DELAY = 1800;
  const wakeWords = useMemo(
    () => ["hey google", "okay google", "hey assistant", "hello assistant"],
    []
  );
  const synth = useRef(window.speechSynthesis);

  const canStartWake = useCallback(() => {
    return !synth.current.speaking && !listening && !wakeRef.current;
  }, [listening]);

  const speakAndWait = useCallback((text) => {
    return new Promise((resolve) => {
      try {
        if (!synth.current) return resolve();
        if (synth.current.speaking) synth.current.cancel();

        const u = new SpeechSynthesisUtterance(text || "");
        u.onend = resolve;
        u.onerror = resolve;
        synth.current.speak(u);
      } catch {
        resolve();
      }
    });
  }, []);

  const initMicrophone = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setInitialized(true);
    } catch {
      alert("Microphone access required. Allow mic and retry Init.");
    }
  }, []);

  const stopCommand = useCallback(() => {
    if (cmdRef.current) {
      try {
        cmdRef.current.onresult = null;
        cmdRef.current.onend = null;
        cmdRef.current.onerror = null;
        cmdRef.current.stop();
      } catch {}
    }
    cmdRef.current = null;
    setListening(false);
  }, []);

  const stopWake = useCallback(() => {
    if (wakeRef.current) {
      try {
        wakeRef.current.onresult = null;
        wakeRef.current.onend = null;
        wakeRef.current.onerror = null;
        wakeRef.current.stop();
      } catch {}
    }
    wakeRef.current = null;
    setWakeStatus("stopped");
  }, []);

  let startWake;

  const safeRestartWake = useCallback(() => {
    setTimeout(() => {
      let attempts = 0;
      const tryStart = () => {
        if (canStartWake()) {
          wakeRef.current = null;
          if (startWake) startWake();
        } else {
          attempts++;
          if (attempts < 10) setTimeout(tryStart, 200);
        }
      };
      tryStart();
    }, WAKE_DELAY);
  }, [canStartWake]);

  const startCommand = useCallback(() => {
    if (!SpeechRecognition) return alert("SpeechRecognition not supported.");

    stopCommand();

    const r = new SpeechRecognition();
    r.lang = "en-US";
    r.interimResults = false;
    r.continuous = false;

    r.onstart = () => setListening(true);

    r.onresult = async (e) => {
      const transcript = e.results[0][0].transcript.trim();
      setQuery(transcript);

      try {
        const res = await sendQuery(transcript);
        setResponse(res);
        speakAndWait(res);
      } catch {}
    };

    r.onerror = () => {
      if (wakeEnabled) safeRestartWake();
    };

    r.onend = () => {
      setListening(false);
      if (wakeEnabled) safeRestartWake();
    };

    try {
      r.start();
      cmdRef.current = r;
    } catch {
      if (wakeEnabled) safeRestartWake();
    }
  }, [SpeechRecognition, stopCommand, speakAndWait, wakeEnabled, safeRestartWake]);

  startWake = useCallback(() => {
    if (!SpeechRecognition || wakeRef.current) return;

    const wr = new SpeechRecognition();
    wr.lang = "en-US";
    wr.interimResults = true;
    wr.continuous = true;

    wr.onstart = () => setWakeStatus("listening");

    wr.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      transcript = transcript.toLowerCase().trim();

      const last = event.results[event.results.length - 1];
      if (!last.isFinal) return;
      if (Date.now() - lastWakeTime.current < 2000) return;

      const found = wakeWords.some((w) => transcript.includes(w));
      if (!found) return;

      lastWakeTime.current = Date.now();

      try {
        wr.onresult = null;
        wr.onend = null;
        wr.onerror = null;
        wr.stop();
      } catch {}

      wakeRef.current = null;
      setWakeStatus("paused");

      (async () => {
        await speakAndWait("Yes?");
        setTimeout(() => startCommand(), 200);
      })();
    };

    wr.onerror = () => {
      setWakeStatus("error");
      if (wakeEnabled) safeRestartWake();
    };

    wr.onend = () => {
      wakeRef.current = null;
      setWakeStatus("stopped");
      if (wakeEnabled) safeRestartWake();
    };

    try {
      wr.start();
      wakeRef.current = wr;
    } catch {
      setWakeStatus("error");
      if (wakeEnabled) safeRestartWake();
    }
  }, [SpeechRecognition, wakeWords, speakAndWait, startCommand, safeRestartWake, wakeEnabled]);

  const toggleWake = useCallback(() => {
    if (!initialized) return alert("Press Init Microphone first.");
    if (!wakeEnabled) {
      setWakeEnabled(true);
      wakeRef.current = null;
      safeRestartWake();
    } else {
      setWakeEnabled(false);
      stopWake();
    }
  }, [initialized, wakeEnabled, safeRestartWake, stopWake]);

  const handleSendQuery = useCallback(async () => {
    if (!query.trim()) return;
    const res = await sendQuery(query);
    setResponse(res);
    speakAndWait(res);
  }, [query, speakAndWait]);

  const handleManualSpeak = useCallback(() => {
    if (!initialized) return alert("Press Init Microphone first.");
    stopWake();
    startCommand();
  }, [initialized, startCommand, stopWake]);

  const handleStopAll = useCallback(() => {
    stopCommand();
    stopWake();
    setWakeEnabled(false);
  }, [stopCommand, stopWake]);

  const handleReset = useCallback(() => {
    handleStopAll();
    setQuery("");
    setResponse("");
    setInitialized(false);
    console.clear();
  }, [handleStopAll]);

  // Restart wake after tab visibility changes
  useEffect(() => {
    const restartIfEnabled = () => {
      if (wakeEnabled) {
        if (wakeRef.current) stopWake();
        safeRestartWake();
      }
    };
    document.addEventListener("visibilitychange", restartIfEnabled);
    window.addEventListener("focus", restartIfEnabled);
    return () => {
      document.removeEventListener("visibilitychange", restartIfEnabled);
      window.removeEventListener("focus", restartIfEnabled);
    };
  }, [wakeEnabled, safeRestartWake, stopWake]);

  useEffect(() => {
    return () => {
      stopWake();
      stopCommand();
      if (synth.current) synth.current.cancel();
    };
  }, [stopWake, stopCommand]);

  const CHECKLIST_ITEMS = useMemo(
    () => [
      ["Init Microphone", initialized],
      ["Wake Word Enabled", wakeEnabled],
      ["Listening for Wake Word", wakeEnabled && wakeStatus === "listening"],
      ["Wake Word Detected", wakeStatus === "paused"],
      ["Listening for Command", listening],
      ["Response Generated", response.trim()],
      ["Command Entered", query.trim()],
    ],
    [initialized, wakeEnabled, wakeStatus, listening, response, query]
  );

  // ------------------------------------------------------------------
  //       UI: PROFESSIONAL LIGHT DASHBOARD STYLING STARTS HERE
  // ------------------------------------------------------------------

  return (
    <ThemeProvider theme={getTheme(mode)}>
      <CssBaseline />

      <Container
        maxWidth="xl"
        sx={{
          mt: 2,
          mb: 4,
          display: "flex",
          justifyContent: "space-around",
        }}
      >
        <Grid container spacing={2}>
          {/* LEFT PANEL ------------------------------------------------ */}
          <Grid item xs={12} md={9}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid #e5e5e5",
                background:
                  mode === "light"
                    ? "#ffffff"
                    : "rgba(255,255,255,0.06)",
              }}
            >
              {/* Header Row */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 2,
                  alignItems: "center",
                }}
              >
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, color: "#555" }}
                  >
                    Wake Status
                  </Typography>

                  {/* Badge */}
                  <Typography
                    sx={{
                      mt: 0.5,
                      fontWeight: 600,
                      display: "inline-block",
                      px: 1.4,
                      py: 0.5,
                      borderRadius: "12px",
                      fontSize: "13px",
                      textTransform: "capitalize",
                      backgroundColor:
                        wakeEnabled && wakeStatus === "listening"
                          ? "#e8f5e9"
                          : wakeEnabled
                          ? "#fff4e5"
                          : "#f2f2f2",
                      color:
                        wakeEnabled && wakeStatus === "listening"
                          ? "#1b5e20"
                          : wakeEnabled
                          ? "#8a6d3b"
                          : "#666",
                      border: "1px solid rgba(0,0,0,0.1)",
                    }}
                  >
                    {wakeEnabled ? wakeStatus : "off"}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1}>
                  {/* Dark/Light Toggle */}
                  <IconButton
                    onClick={() =>
                      setMode(mode === "light" ? "dark" : "light")
                    }
                    sx={{
                      bgcolor: "background.paper",
                      borderRadius: 2,
                      p: 1,
                      border: "1px solid #ddd",
                    }}
                  >
                    {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
                  </IconButton>

                  {/* Enable/Disable Wake */}
                  <Button
                    variant={wakeEnabled ? "contained" : "outlined"}
                    startIcon={<PowerSettingsNewIcon />}
                    onClick={toggleWake}
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      px: 2,
                      fontWeight: 600,
                    }}
                  >
                    {wakeEnabled ? "Disable" : "Enable"}
                  </Button>
                </Stack>
              </Box>

              {/* Title */}
              <Typography
                variant="h5"
                align="center"
                sx={{
                  fontWeight: 800,
                  mb: 1,
                  letterSpacing: 0.3,
                  color: "#333",
                }}
              >
                Voice Assistant
              </Typography>

              <ChecklistStatus mode={mode} checklistItems={CHECKLIST_ITEMS} />

              {/* Input Row */}
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  mb: 2,
                  alignItems: "center",
                }}
              >
                <TextField
                  fullWidth
                  label="Type or speak a command"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") handleSendQuery();
                  }}
                  size="small"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />

                <Button
                  variant="contained"
                  onClick={handleSendQuery}
                  sx={{
                    borderRadius: 2,
                    p: 1.5,
                    minWidth: "46px",
                  }}
                >
                  <SendIcon fontSize="small" />
                </Button>
              </Box>

              {/* CONTROL BUTTONS */}
              <Stack
                direction="row"
                spacing={1.5}
                justifyContent="center"
                sx={{ mb: 2 }}
              >
                <Button
                  variant={listening ? "outlined" : "contained"}
                  color={listening ? "secondary" : "primary"}
                  onClick={handleManualSpeak}
                  startIcon={<MicIcon />}
                  disabled={!initialized}
                  sx={{
                    borderRadius: 2,
                    px: 2.5,
                    fontWeight: 600,
                  }}
                >
                  {listening ? "Listening..." : "Speak"}
                </Button>

                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleStopAll}
                  startIcon={<StopIcon />}
                  sx={{
                    borderRadius: 2,
                    px: 2.2,
                    fontWeight: 600,
                  }}
                >
                  Stop
                </Button>

                <Button
                  variant="outlined"
                  color="info"
                  onClick={initMicrophone}
                  startIcon={<MicIcon />}
                  disabled={initialized}
                  sx={{
                    borderRadius: 2,
                    px: 2.2,
                    fontWeight: 600,
                  }}
                >
                  {initialized ? "Mic Ready" : "Init Mic"}
                </Button>

                <Button
                  variant="outlined"
                  color="warning"
                  onClick={handleReset}
                  startIcon={<ClearAllIcon />}
                  sx={{
                    borderRadius: 2,
                    px: 2.2,
                    fontWeight: 600,
                  }}
                >
                  Reset
                </Button>
              </Stack>

              {/* RESPONSE BOX */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  minHeight: 120,
                  borderRadius: 3,
                  border: "1px solid #e5e5e5",
                  background:
                    mode === "light"
                      ? "#fafafa"
                      : "rgba(255,255,255,0.05)",
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700, color: "#444" }}
                >
                  Response:
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    mt: 1,
                    whiteSpace: "pre-wrap",
                    opacity: 0.9,
                  }}
                >
                  {response}
                </Typography>
              </Paper>
            </Paper>
          </Grid>

          {/* RIGHT PANEL ------------------------------------------------ */}
          <Grid item xs={12} md={9}>
            <MemoizedCommandsList />
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  );
}

export default React.memo(App);
