// import React from "react";
// import {
//     List,
//     ListItem,
//     ListItemText,
//     Typography,
//     Paper,
//     Divider,
// } from "@mui/material";

// const commands = [
//     { title: "Wake Word", description: "Say 'hey google' (or your custom wake word) to activate voice assistant." },
//     { title: "Time", description: "Say 'what is the time?' or 'time' to get the current time." },
//     { title: "Date", description: "Say 'what is the date today?' or 'today's date'." },
//     { title: "Joke", description: "Say 'tell me a joke' to get a random programming joke." },
//     { title: "Weather", description: "Say 'weather in [city]' to get current weather." },
//     { title: "Forecast", description: "Say 'forecast in [city]' to get upcoming weather." },
//     { title: "Air Quality", description: "Say 'air quality in [city]' to get AQI info." },
//     { title: "Open Website", description: "Say 'open YouTube', 'open Google', 'open Instagram' etc." },
//     { title: "Search Internet", description: "Say 'search for [query]' to google search anything." },
//     { title: "Open System Apps", description: "Say 'open Notepad', 'open Calculator', 'open Downloads'." },
//     { title: "Music", description: "Say 'play music' or 'play song' (opens YouTube Music)." },
//     { title: "Close Tab", description: "Say 'close this tab' to close the current browser tab." },
//     { title: "Stop Listening", description: "Say 'stop listening' to pause voice recognition." },
//     { title: "Start Listening", description: "Say 'start listening' to activate voice recognition manually." },
//     { title: "Clear Chat", description: "Say 'clear chat' to reset message history." },
//     { title: "Theme Change", description: "Say 'enable dark mode' or 'enable light mode'." },
//     { title: "Repeat Response", description: "Say 'repeat' to hear the last reply again." },
//     { title: "Greetings", description: "Say 'hello', 'hi', 'who are you', 'what can you do' etc." },
//     { title: "Assistant Info", description: "Say 'about you' or 'who made you'." },
//     { title: "Backend Status", description: "Say 'check server' to test backend connection." },
//     { title: "Voice Commands Button", description: "Click 🎤 button and speak commands directly." },
// ];

// export default function CommandsList() {
//     return (
//         <Paper
//             elevation={2}
//             sx={{
//                 p: 2,
//                 mt: 0,
//                 maxHeight: "450px",         
//                 overflowY: "auto",           
//                 borderRadius: "20px",
//                 scrollbarWidth: "thin",      
//                 "&::-webkit-scrollbar": {    
//                     width: "10px",
//                 },
//                 "&::-webkit-scrollbar-thumb": {
//                     backgroundColor: "#888",
//                     borderRadius: "10px",
//                 },
//                 "&::-webkit-scrollbar-thumb:hover": {
//                     backgroundColor: "#555",
//                 },
//             }}
//         >
//             <Typography variant="h6" sx={{color:'red'}} gutterBottom>
//                 Supported Commands
//             </Typography>
//             <Divider sx={{ mb: 2 }} />

//             <List>
//                 {commands.map((cmd, index) => (
//                     <ListItem key={index} sx={{ py: 0.5 }}>
//                         <ListItemText
//                             primary={cmd.title}
//                             secondary={cmd.description}
//                         />
//                     </ListItem>
//                 ))}
//             </List>
//         </Paper>
//     );
// }














import React from "react";
import {
    List,
    ListItem,
    ListItemText,
    Typography,
    Paper,
    Divider,
} from "@mui/material";

const commands = [
    { title: "Wake Word", description: "Say 'hey google' to activate." },
    { title: "Time", description: "Ask: 'what is the time?'." },
    { title: "Date", description: "Ask: 'what's today's date?'." },
    { title: "Joke", description: "Ask: 'tell me a joke'." },
    { title: "Weather", description: "Say 'weather in [city]'." },
    { title: "Forecast", description: "Say 'forecast in [city]'." },
    { title: "Air Quality", description: "Say 'air quality in [city]'." },
    { title: "Open Website", description: "Say 'open YouTube', 'open Google', etc." },
    { title: "Search Internet", description: "Say 'search for [query]'." },
    { title: "Open System Apps", description: "Say 'open Notepad', 'open Calculator'." },
    { title: "Music", description: "Say 'play music'." },
    { title: "Close Tab", description: "Say 'close this tab'." },
    { title: "Stop Listening", description: "Say 'stop listening'." },
    { title: "Start Listening", description: "Say 'start listening'." },
    { title: "Clear Chat", description: "Say 'clear chat'." },
    { title: "Theme Change", description: "Say 'enable dark mode'." },
    { title: "Repeat Response", description: "Say 'repeat'." },
    { title: "Greetings", description: "Say 'hello', 'hi', etc." },
    { title: "Assistant Info", description: "Say 'about you'." },
    { title: "Backend Status", description: "Say 'check server'." },
    { title: "Voice Commands Button", description: "Click 🎤 to speak commands." },
];

export default function CommandsList() {
    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                mt: 0,
                width: "120%",           
                maxWidth: "420px",
                overflowY: "auto",
                borderRadius: 3,
                border: "1px solid #e0e0e0",
                background: "#ffffff",
                scrollbarWidth: "thin",

                "&::-webkit-scrollbar": {
                    width: "1px",
                },
                "&::-webkit-scrollbar-thumb": {
                    backgroundColor: "#c1c1c1",
                    borderRadius: "10px",
                },
                "&::-webkit-scrollbar-thumb:hover": {
                    backgroundColor: "#a0a0a0",
                },
            }}
        >
            <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, mb: 1 }}
            >
                Supported Commands
            </Typography>

            <Divider sx={{ mb: 1.5 }} />

            <List>
                {commands.map((cmd, index) => (
                    <ListItem key={index} sx={{ py: 0.4 }}>
                        <ListItemText
                            primaryTypographyProps={{ variant: "body2", fontWeight: 600 }}
                            secondaryTypographyProps={{ variant: "caption" }}
                            primary={cmd.title}
                            secondary={cmd.description}
                        />
                    </ListItem>
                ))}
            </List>
        </Paper>
    );
}
