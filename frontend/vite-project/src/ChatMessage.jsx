// ChatMessage.jsx
import React from "react";
import { Box, Paper, Typography } from "@mui/material";

export default function ChatMessage({ role, text }) {
    const isUser = role === "user";
    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: isUser ? "flex-end" : "flex-start",
                mb: 1,
                px: 1,
            }}
        >
            <Paper
                elevation={1}
                sx={{
                    p: 1.2,
                    maxWidth: "80%",
                    backgroundColor: isUser ? "primary.main" : "background.paper",
                    color: isUser ? "primary.contrastText" : "text.primary",
                }}
            >
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {text}
                </Typography>
            </Paper>
        </Box>
    );
}
