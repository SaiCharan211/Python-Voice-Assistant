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

const MemoizedCommandsList = React.memo(CommandsList);

export default function App() {
  const [mode, setMode] = useState("light");
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [listening, setListening] = useState(false); 
  const [wakeEnabled, setWakeEnabled] = useState(false);
  const [wakeStatus, setWakeStatus] = useState("stopped");
  const [initialized, setInitialized] = useState(false); 

  const SpeechRecognition = useMemo(
    () => window.SpeechRecognition || window.webkitSpeechRecognition || null,
    []
  );
  const wakeRef = useRef(null);
  const cmdRef = useRef(null);
  const lastWakeTime = useRef(0);
  const WAKE_DELAY = 2200; 
  const wakeWords = useMemo(
    () => ["hey google", "okay google", "hey assistant", "hello assistant"],
    []
  );
  const synth = useRef(window.speechSynthesis);

  const canStartWake = useCallback(() => {
    return (
      !synth.current.speaking &&
      !listening &&
      !wakeRef.current
    );
  }, [listening]);

  const speakAndWait = useCallback((text) => {
    return new Promise((resolve) => {
      try {
        if (!synth.current) return resolve();

        if (synth.current.speaking) {
          synth.current.cancel();
        }

        const u = new SpeechSynthesisUtterance(text || "");
        u.onend = () => {
          resolve();
        };
        u.onerror = (e) => {
          resolve();
        };
        synth.current.speak(u);
      } catch (e) {
        resolve();
      }
    });
  }, []);

  const initMicrophone = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setInitialized(true);
    } catch (e) {
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
      } catch (e) {
        console.warn("stopCommand: stop() failed", e);
      }
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
      } catch (e) {
        console.warn("stopWake: stop() failed", e);
      }
    }
    wakeRef.current = null;
    setWakeStatus("stopped");
  }, []);

  let startWake;

  const safeRestartWake = useCallback(() => {

    setTimeout(() => {
      let attempts = 0;
      const maxAttempts = 10;

      const tryStart = () => {
        if (canStartWake()) {
          wakeRef.current = null;
          startWake(); 
        } else {
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(tryStart, 200);
          } else {
            console.log("[SAFE] Wake restart failed after retries.");
          }
        }
      };
      tryStart();
    }, WAKE_DELAY);
  }, [canStartWake]);

  const startCommand = useCallback(() => {
    if (!SpeechRecognition) {
      alert("SpeechRecognition not supported in this browser.");
      return;
    }

    stopCommand(); 

    const r = new SpeechRecognition();
    r.lang = "en-US";
    r.interimResults = false;
    r.continuous = false; 

    r.onstart = () => {
      setListening(true);
    };

    r.onresult = async (e) => {
      const transcript = e.results[0][0].transcript.trim();
      try {
        setQuery(transcript);

        const res = await sendQuery(transcript);
        setResponse(res);

        await speakAndWait(res);
      } catch (err) {
        console.error("[COMMAND] onresult error:", err);
      }
    };

    r.onerror = (err) => {
      if (wakeEnabled) safeRestartWake();
    };

    r.onend = () => {
      setListening(false);
      if (wakeEnabled) {
        safeRestartWake();
      }
    };

    try {
      r.start();
      cmdRef.current = r;
    } catch (e) {
      console.error("[COMMAND] start() error:", e);
      if (wakeEnabled) safeRestartWake();
    }
  }, [SpeechRecognition, stopCommand, speakAndWait, wakeEnabled, safeRestartWake]);

  startWake = useCallback(() => {
    if (!SpeechRecognition) return;
    if (wakeRef.current) return; 

    const wr = new SpeechRecognition();
    wr.lang = "en-US";
    wr.interimResults = true;
    wr.continuous = true;

    wr.onstart = () => {
      setWakeStatus("listening");
    };

    wr.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      transcript = transcript.toLowerCase().trim();

      const last = event.results[event.results.length - 1];
      if (!last.isFinal) return; 

      if (Date.now() - lastWakeTime.current < 2000) {
        return;
      }

      const found = wakeWords.some((w) => transcript.includes(w));
      if (!found) return;

      console.log("[WAKE] DETECTED hotword:", transcript);
      lastWakeTime.current = Date.now();

      try {
        wr.onresult = null;
        wr.onend = null;
        wr.onerror = null;
        wr.stop();
      } catch (e) {
        console.warn("[WAKE] stop() threw:", e);
      }
      wakeRef.current = null;
      setWakeStatus("paused");

      (async () => {
        await speakAndWait("Yes?");
        setTimeout(() => startCommand(), 200);
      })();
    };

    wr.onerror = (e) => {
      console.warn("[WAKE] error:", e);
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
    } catch (e) {
      console.error("[WAKE] start() failed:", e);
      wakeRef.current = null;
      setWakeStatus("error");
      if (wakeEnabled) safeRestartWake(); 
    }
  }, [SpeechRecognition, wakeWords, speakAndWait, startCommand, safeRestartWake, wakeEnabled]);


  const toggleWake = useCallback(() => {
    if (!initialized) {
      alert("Press Init Microphone first (required by browsers).");
      return;
    }
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
    await speakAndWait(res);
  }, [query, speakAndWait]);

  const handleManualSpeak = useCallback(() => {
    if (!initialized) {
      alert("Press Init Microphone first.");
      return;
    }
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
      synth.current.cancel(); 
    };
    
  }, [stopWake, stopCommand]);

  return (
    <ThemeProvider theme={getTheme(mode)}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ mt: 6 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={7}>
            <Paper elevation={6} sx={{ p: 4, borderRadius: 4 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                  Wake:{" "}
                  <span style={{ color: wakeEnabled && wakeStatus === "listening" ? "green" : "orange" }}>
                    {wakeEnabled ? wakeStatus : "off"}
                  </span>
                </Typography>

                <Box>
                  <IconButton onClick={() => setMode(mode === "light" ? "dark" : "light")}>
                    {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
                  </IconButton>

                  <Button
                    variant={wakeEnabled ? "contained" : "outlined"}
                    startIcon={<PowerSettingsNewIcon />}
                    onClick={toggleWake}
                    sx={{ mr: 1 }}
                  >
                    {wakeEnabled ? "Disable Wake" : "Enable Wake"}
                  </Button>
                </Box>
              </Box>

              <Typography variant="h4" align="center" sx={{ fontWeight: "bold", mb: 3 }}>
                Voice Assistant
              </Typography>

              <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                <TextField
                  fullWidth
                  label="Type or speak a command"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleSendQuery();
                  }}
                />
                <Button variant="contained" onClick={handleSendQuery}>
                  <SendIcon />
                </Button>
              </Box>

              <Stack direction="row" spacing={2} justifyContent="center" mb={3}>
                <Button
                  variant={listening ? "outlined" : "contained"}
                  color={listening ? "secondary" : "primary"}
                  onClick={handleManualSpeak}
                  startIcon={<MicIcon />}
                  disabled={!initialized} 
                >
                  {listening ? "Listening..." : "Speak Command"}
                </Button>

                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleStopAll}
                  startIcon={<StopIcon />}
                >
                  Stop All
                </Button>

                <Button
                  variant="outlined"
                  color="info"
                  onClick={initMicrophone}
                  startIcon={<MicIcon />}
                  disabled={initialized}
                >
                  {initialized ? "Mic Initialized" : "Init Microphone"}
                </Button>

                <Button
                  variant="outlined"
                  color="warning"
                  onClick={handleReset}
                  startIcon={<ClearAllIcon />}
                >
                  Reset App
                </Button>
              </Stack>

              <Paper elevation={2} sx={{ p: 3, minHeight: 140 }}>
                <Typography variant="subtitle2">Response:</Typography>
                <Typography variant="body1" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
                  {response}
                </Typography>
              </Paper>
            </Paper>
          </Grid>

          <Grid item xs={12} md={5}>
            <MemoizedCommandsList />
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  );
}