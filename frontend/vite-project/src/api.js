import axios from "axios";

export const sendQuery = async (text) => {
    try {
        const res = await axios.post("http://localhost:8000/query", { text });
        return res.data.response;
    } catch (error) {
        console.error("sendQuery error:", error);
        return "Error contacting backend.";
    }
};

