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


  return (
    <ThemeProvider theme={getTheme(mode)}>
      <CssBaseline />

      <Container
        maxWidth="xl"
        sx={{
          mt: 2,
          mb: 4.1,
          display: "flex",
          justifyContent: "space-around",
        }}
      >
        <Grid container spacing={2}>
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

          <Grid item xs={12} md={9}>
            <MemoizedCommandsList />
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  );
}

export default React.memo(App);
