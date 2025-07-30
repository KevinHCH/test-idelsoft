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
  Collapse,
  Alert,
  CircularProgress,
} from "@mui/material"
import {
  Close as CloseIcon,
  AutoAwesome as AIIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material"
import AIPromptModal from "./AIPromptModal"
import { streamAIGeneration } from "../utils/streamUtils"

export default function ComposeEmailModal({ open, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    to: "",
    cc: "",
    bcc: "",
    subject: "",
    body: "",
  })
  const [showCcBcc, setShowCcBcc] = useState(false)
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [assistantType, setAssistantType] = useState("")

  const handleInputChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }))
  }

  const handleSubmit = () => {
    if (!formData.to || !formData.subject || !formData.body) {
      alert("Please fill in To, Subject, and Body fields")
      return
    }
    onSubmit(formData)
    handleClose()
  }

  const handleClose = () => {
    setFormData({
      to: "",
      cc: "",
      bcc: "",
      subject: "",
      body: "",
    })
    setShowCcBcc(false)
    setAssistantType("")
    onClose()
  }

  const handleAIGenerate = async (prompt, recipientInfo) => {
    setIsGenerating(true)
    setAiModalOpen(false)
    setFormData((prev) => ({ ...prev, subject: "", body: "" }))

    const callbacks = {
      onAssistantType: (type) => setAssistantType(type),
      onSubject: (subject) =>
        setFormData((prev) => ({ ...prev, subject: subject })),
      onBody: (body) => setFormData((prev) => ({ ...prev, body: body })),
      onComplete: () => {
        setIsGenerating(false)
        console.log("Streaming finished.")
      },
      onError: (error) => {
        setIsGenerating(false)
        console.error("Streaming error:", error)
        alert("Failed to generate email. Please try again.")
      },
    }

    await streamAIGeneration(prompt, recipientInfo, callbacks)
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { height: "80vh" },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="h6">Compose Email</Typography>
            {assistantType && (
              <Chip
                label={`${assistantType} Assistant`}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
        >
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
            <Button
              variant="outlined"
              startIcon={
                isGenerating ? <CircularProgress size={16} /> : <AIIcon />
              }
              onClick={() => setAiModalOpen(true)}
              disabled={isGenerating}
              sx={{
                background: "linear-gradient(45deg, #FF6B6B, #4ECDC4)",
                color: "white",
                border: "none",
                "&:hover": {
                  background: "linear-gradient(45deg, #FF5252, #26C6DA)",
                  border: "none",
                },
              }}
            >
              {isGenerating ? "Generating..." : "AI ✨"}
            </Button>
          </Box>

          <TextField
            label="To"
            value={formData.to}
            onChange={handleInputChange("to")}
            fullWidth
            required
            variant="outlined"
          />

          <Box>
            <Button
              size="small"
              onClick={() => setShowCcBcc(!showCcBcc)}
              endIcon={showCcBcc ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ mb: 1 }}
            >
              CC/BCC
            </Button>

            <Collapse in={showCcBcc}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <TextField
                  label="CC"
                  value={formData.cc}
                  onChange={handleInputChange("cc")}
                  fullWidth
                  variant="outlined"
                />
                <TextField
                  label="BCC"
                  value={formData.bcc}
                  onChange={handleInputChange("bcc")}
                  fullWidth
                  variant="outlined"
                />
              </Box>
            </Collapse>
          </Box>

          <TextField
            label="Subject"
            value={formData.subject}
            onChange={handleInputChange("subject")}
            fullWidth
            required
            variant="outlined"
          />

          <TextField
            label="Body"
            value={formData.body}
            onChange={handleInputChange("body")}
            fullWidth
            required
            multiline
            rows={12}
            variant="outlined"
          />

          {isGenerating && (
            <Alert severity="info" sx={{ mt: 1 }}>
              AI is generating your email content... Please wait.
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={
              !formData.to ||
              !formData.subject ||
              !formData.body ||
              isGenerating
            }
          >
            Send Email
          </Button>
        </DialogActions>
      </Dialog>

      <AIPromptModal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onSubmit={handleAIGenerate}
      />
    </>
  )
}
