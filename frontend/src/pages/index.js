import { useState, useEffect } from "react"
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Typography,
  Paper,
  Fab,
  AppBar,
  Toolbar,
  Divider,
  Chip,
  IconButton,
} from "@mui/material"
import {
  Add as AddIcon,
  Email as EmailIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material"
import ComposeEmailModal from "../components/ComposeEmailModal"

const DRAWER_WIDTH = 350

export default function Home() {
  const [emails, setEmails] = useState([])
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [composeOpen, setComposeOpen] = useState(false)

  useEffect(() => {
    fetchEmails()
  }, [])

  const fetchEmails = async () => {
    try {
      const response = await fetch("/api/emails")
      const data = await response.json()
      const emailsArray = data.emails || []
      if (Array.isArray(emailsArray)) {
        setEmails(emailsArray)
        if (emailsArray.length > 0 && !selectedEmail) {
          setSelectedEmail(emailsArray[0])
        }
      } else {
        console.error("API returned non-array emails:", data)
        setEmails([])
      }
    } catch (error) {
      console.error("Error fetching emails:", error)
      setEmails([])
    }
  }

  const handleEmailSelect = (email) => {
    setSelectedEmail(email)
  }

  const handleDeleteEmail = async (emailId, event) => {
    event.stopPropagation()
    try {
      await fetch(`/api/emails/${emailId}`, {
        method: "DELETE",
      })
      await fetchEmails()
      if (selectedEmail && selectedEmail.id === emailId) {
        setSelectedEmail(null)
      }
    } catch (error) {
      console.error("Error deleting email:", error)
    }
  }

  const handleComposeSubmit = async (emailData) => {
    try {
      await fetch("/api/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailData),
      })
      await fetchEmails()
      setComposeOpen(false)
    } catch (error) {
      console.error("Error creating email:", error)
    }
  }

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
          },
        }}
      >
        <AppBar
          position="static"
          elevation={0}
          sx={{ bgcolor: "primary.main" }}
        >
          <Toolbar>
            <EmailIcon sx={{ mr: 2 }} />
            <Typography variant="h6">
              Emails ({Array.isArray(emails) ? emails.length : 0})
            </Typography>
          </Toolbar>
        </AppBar>

        <List sx={{ flex: 1, overflow: "auto" }}>
          {Array.isArray(emails) &&
            emails.map((email) => (
              <ListItem
                key={email.id}
                button
                selected={selectedEmail?.id === email.id}
                onClick={() => handleEmailSelect(email)}
                sx={{
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  "&.Mui-selected": {
                    backgroundColor: "action.selected",
                  },
                }}
              >
                <ListItemText
                  primary={
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        noWrap
                        sx={{ maxWidth: "70%" }}
                      >
                        {email.subject}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={(e) => handleDeleteEmail(email.id, e)}
                        sx={{ ml: 1 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                      >
                        To: {email.to}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        noWrap
                        sx={{ mt: 0.5 }}
                      >
                        {email.body?.substring(0, 50)}...
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, overflow: "auto" }}>
        {selectedEmail ? (
          <Paper elevation={1} sx={{ p: 3, height: "fit-content" }}>
            <Typography variant="h4" gutterBottom>
              {selectedEmail.subject}
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>From:</strong> sender@example.com
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>To:</strong> {selectedEmail.to}
              </Typography>
              {selectedEmail.cc && (
                <Typography variant="body2" color="text.secondary">
                  <strong>CC:</strong> {selectedEmail.cc}
                </Typography>
              )}
              {selectedEmail.bcc && (
                <Typography variant="body2" color="text.secondary">
                  <strong>BCC:</strong> {selectedEmail.bcc}
                </Typography>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography
              variant="body1"
              sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}
            >
              {selectedEmail.body}
            </Typography>
          </Paper>
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <Typography variant="h6" color="text.secondary">
              Select an email to view its content
            </Typography>
          </Box>
        )}
      </Box>

      <Fab
        color="primary"
        aria-label="compose"
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
        }}
        onClick={() => setComposeOpen(true)}
      >
        <AddIcon />
      </Fab>

      <ComposeEmailModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSubmit={handleComposeSubmit}
      />
    </Box>
  )
}
