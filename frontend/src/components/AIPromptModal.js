import { useState } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  IconButton,
  Typography,
  Chip,
  Divider,
  Alert,
} from "@mui/material"
import {
  Close as CloseIcon,
  AutoAwesome as AIIcon,
  TipsAndUpdates as TipsIcon,
} from "@mui/icons-material"

export default function AIPromptModal({ open, onClose, onSubmit }) {
  const [prompt, setPrompt] = useState("")
  const [recipientInfo, setRecipientInfo] = useState("")

  const handleSubmit = () => {
    if (!prompt.trim()) {
      alert("Please enter a description of what the email should be about")
      return
    }
    onSubmit(prompt, recipientInfo)
    handleClose()
  }

  const handleClose = () => {
    setPrompt("")
    setRecipientInfo("")
    onClose()
  }

  const examplePrompts = [
    "Meeting request for Tuesday to discuss project",
    "Follow up on our partnership proposal",
    "Sales pitch for new CRM software to tech startup",
    "Thank you email after successful demo",
    "Schedule a product demonstration next week",
  ]

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AIIcon color="primary" />
          <Typography variant="h6">AI Email Assistant</Typography>
        </Box>
        <IconButton onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pb: 1 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <TipsIcon fontSize="small" />
            <Typography variant="subtitle2">How it works:</Typography>
          </Box>
          <Typography variant="body2">
            Our AI will automatically choose between{" "}
            <strong>Sales Assistant</strong> (for pitches) or{" "}
            <strong>Follow-up Assistant</strong> (for check-ins) based on your
            description.
          </Typography>
        </Alert>

        <TextField
          label="What should this email be about?"
          placeholder="e.g., Meeting request for Tuesday, Follow up on our demo, Sales pitch for new software..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          sx={{ mb: 3 }}
        />

        <TextField
          label="Recipient Information (Optional)"
          placeholder="e.g., Marketing director at mid-size company, Tech startup CEO, Busy executive..."
          value={recipientInfo}
          onChange={(e) => setRecipientInfo(e.target.value)}
          fullWidth
          multiline
          rows={2}
          variant="outlined"
          sx={{ mb: 3 }}
          helperText="Helps create more targeted sales emails"
        />

        <Divider sx={{ my: 2 }} />

        <Box>
          <Typography
            variant="subtitle2"
            sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}
          >
            <TipsIcon fontSize="small" color="action" />
            Example prompts:
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {examplePrompts.map((example, index) => (
              <Chip
                key={index}
                label={example}
                variant="outlined"
                size="small"
                onClick={() => setPrompt(example)}
                sx={{
                  cursor: "pointer",
                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                }}
              />
            ))}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={<AIIcon />}
          disabled={!prompt.trim()}
          sx={{
            background: "linear-gradient(45deg, #FF6B6B, #4ECDC4)",
            "&:hover": {
              background: "linear-gradient(45deg, #FF5252, #26C6DA)",
            },
          }}
        >
          Generate Email
        </Button>
      </DialogActions>
    </Dialog>
  )
}
