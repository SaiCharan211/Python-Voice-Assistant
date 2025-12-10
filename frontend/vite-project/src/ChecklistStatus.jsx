// import React from 'react';
// import { Paper, Typography } from '@mui/material';

// const ChecklistStatus = React.memo(({ mode, checklistItems }) => (
//     <Paper
//         elevation={0}
//         sx={{
//             p: 3,
//             mb: 3,
//             borderRadius: 4,
//             background:
//                 mode === "light"
//                     ? "rgba(245,245,245,0.8)"
//                     : "rgba(255,255,255,0.06)",
//             border: "1px solid rgba(255,255,255,0.1)",
//         }}
//     >
//         <Typography
//             variant="h6"
//             sx={{ fontWeight: "bold", mb: 2, opacity: 0.9 }}
//         >
//             Usage Checklist
//         </Typography>

//         {checklistItems.map(([label, flag], i) => (
//             <Typography
//                 key={i}
//                 variant="body1"
//                 sx={{
//                     mb: 1,
//                     display: "flex",
//                     gap: 1,
//                     alignItems: "center",
//                     color: flag ? "green" : "text.secondary",
//                     fontWeight: flag ? "600" : "400",
//                 }}
//             >
//                 {flag ? "✓" : "○"} {label}
//             </Typography>
//         ))}
//     </Paper>
// ));

// export default ChecklistStatus;




















import React from 'react';
import { Paper, Typography } from '@mui/material';

const ChecklistStatus = React.memo(({ mode, checklistItems }) => (
    <Paper
        elevation={0}
        sx={{
            p: 2.5,
            mb: 3,
            borderRadius: 3,
            background: mode === "light" ? "#fafafa" : "rgba(255,255,255,0.06)",
            border: mode === "light" ? "1px solid #e0e0e0" : "1px solid rgba(255,255,255,0.1)",
        }}
    >
        <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, mb: 1.5 }}
        >
            Usage Checklist
        </Typography>

        {checklistItems.map(([label, flag], i) => (
            <Typography
                key={i}
                variant="body2"
                sx={{
                    mb: 0.6,
                    display: "flex",
                    gap: 1,
                    alignItems: "center",
                    color: flag ? "#2e7d32" : "text.secondary",
                    fontWeight: flag ? 600 : 400,
                }}
            >
                {flag ? "✓" : "○"} {label}
            </Typography>
        ))}
    </Paper>
));

export default ChecklistStatus;
