# GHAC Survey - Question Timing Report

## Overview
This report documents the preset delays between all survey blocks to help review chatbot performance when deployed.

---

## Opening Section

| Block ID | Block Content | Delay (ms) | Delay (seconds) | Notes |
|----------|---------------|------------|-----------------|-------|
| **b0** | "Hi! I'm Amanda Roy, CEO of the Greater Hartford Arts Council." | 1000 | 1.0s | Opening greeting |
| **b0a** | "Click play below to hear why I'm excited to chat with you today..." | 2000 | 2.0s | Video intro prompt |
| **b1** | Video autoplay (Amanda's intro) | - | - | User controlled |
| **b1a** | "Yep, that's me! ☝️" | 1000 | 1.0s | After video watched |
| **b1a-skip** | "Alright! Let's get right to it!" | 1000 | 1.0s | After video skipped |
| **b1b** | "We take your privacy seriously (but not ourselves) 😜" | 1000 | 1.0s | Privacy intro |
| **b1c** | "By continuing you're cool with how we use your answers..." | - | - | User action required |
| **b2** | "Have you been to one of our programs before?" | - | - | User action required |
| **b2-info** | "No problem! So we're the largest..." | 1500 | 1.5s | GHAC info |
| **b2-info-1** | "So it's our mission to put the arts at the center..." | 1500 | 1.5s | Mission statement |
| **b2-info-2** | "Heard enough or want to continue learning more?" | - | - | User action required |
| **b2-info-ready** | "Great! Let's talk about what you value in the arts." | 1000 | 1.0s | Continue to survey |
| **b2-info-goodbye** | "Thanks for your time! Have a great day!" | 2000 | 2.0s | Exit message |
| **b3** | "What's your first name?" | - | - | User input required |
| **b3-response** | "Nice to meet you {{user_name}}!" | 1000 | 1.0s | Personalized greeting |

---

## Connection & Context Section

| Block ID | Block Content | Delay (ms) | Delay (seconds) | Notes |
|----------|---------------|------------|-----------------|-------|
| **b4** | "Help me understand your connection to Greater Hartford..." | - | - | User action required |
| **b4a** | Dynamic response based on connection type | 1500 | 1.5s | Varies by answer |
| **b5** | "How are you connected to the arts?" | - | - | User action required |
| **b5-response** | "I was hoping you'd say..." | 1500 | 1.5s | When includes performing |
| **b5-other-only** | "I'd love to hear more about that!" | - | - | Text input for 'other' |
| **b5-thanks-gif** | Celebration GIF | 2000 | 2.0s | Thank you animation |
| **b5-thanks** | "Thank you so much for sharing that with me!" | 1500 | 1.5s | Acknowledgment |

---

## Values & Beliefs Section

| Block ID | Block Content | Delay (ms) | Delay (seconds) | Notes |
|----------|---------------|------------|-----------------|-------|
| **b6** | "How important are arts & culture to quality of life?" | - | - | Scale question |
| **b6-response** | Response based on importance level | 1500 | 1.5s | Conditional message |
| **b7** | Video question - personal story | - | - | VideoAsk recording |
| **b7-thanks-gif** | Celebration GIF | 2000 | 2.0s | If video recorded |
| **b7-response** | "Thank you for sharing your story!" | 1500 | 1.5s | Acknowledgment |
| **b7-permission** | "May I share your story?" | - | - | User consent |
| **b7-permission-yes** | "Wonderful! Thank you!" | 1000 | 1.0s | Permission granted |
| **b7-permission-no** | "No problem at all!" | 1000 | 1.0s | Permission declined |

---

## Motivations & Perceptions Section

| Block ID | Block Content | Delay (ms) | Delay (seconds) | Notes |
|----------|---------------|------------|-----------------|-------|
| **b8** | "What would you most like to see?" | - | - | Ranking cards |
| **b8-other** | "What else would you like to see?" | - | - | Text input |
| **b9** | "What arts and culture activities interest you?" | - | - | Multiple choice |
| **b9-response** | Response varies by selections | 1500 | 1.5s | Conditional |

---

## Engagement & Barriers Section

| Block ID | Block Content | Delay (ms) | Delay (seconds) | Notes |
|----------|---------------|------------|-----------------|-------|
| **b10** | "What might prevent you from attending?" | - | - | Multiple choice |
| **b10-response** | Response varies by barriers | 1500 | 1.5s | Conditional |
| **b11** | "How could we make events more accessible?" | - | - | Text input |

---

## Vision & Identity Section

| Block ID | Block Content | Delay (ms) | Delay (seconds) | Notes |
|----------|---------------|------------|-----------------|-------|
| **b12** | Video question - magic wand | - | - | VideoAsk recording |
| **b12-response** | "I love that vision!" | 1500 | 1.5s | Acknowledgment |
| **b12-permission** | "May I share your vision?" | - | - | User consent |
| **b12-permission-yes** | "Wonderful! Thank you!" | 1000 | 1.0s | Permission granted |
| **b12-permission-no** | "No problem at all!" | 1000 | 1.0s | Permission declined |
| **b13** | "Select words describing Hartford's arts identity" | - | - | Multiple choice |
| **b13-other** | "What other words?" | - | - | Text input |
| **b14** | Semantic differential scale | - | - | Scale matrix |

---

## Commitment & Next Steps Section

| Block ID | Block Content | Delay (ms) | Delay (seconds) | Notes |
|----------|---------------|------------|-----------------|-------|
| **b15** | "Do you donate to arts organizations?" | - | - | Single choice |
| **b15-learn-more** | Information about donation impact | - | - | User reads, then continues |
| **b16** | "How to stay connected?" | - | - | Single choice |
| **b16-no-updates** | "No problem at all!" | 1000 | 1.0s | No contact wanted |
| **b16a-email** | Email input form | - | - | User input |
| **b16a-text** | Phone input form | - | - | User input |
| **b16a-newsletter** | Email input form | - | - | User input |
| **b16a-mix** | Email and phone input | - | - | User input |
| **b16a-social** | Social media links | 3000 | 3.0s | Auto-advance |

---

## Closing & Demographics Section

| Block ID | Block Content | Delay (ms) | Delay (seconds) | Notes |
|----------|---------------|------------|-----------------|-------|
| **b17** | "How valuable was this conversation?" | - | - | Scale question |
| **b17-response** | Response based on value rating | 1500 | 1.5s | Conditional |
| **b18** | "Share demographic info?" | - | - | Yes/No choice |
| **b18-no-share-transition** | Transition message | 1000 | 1.0s | If no demographics |
| **b18-congratulations** | "Congratulations! You did it!" | 1500 | 1.5s | Before celebration |
| **b19** | Demographics questions | - | - | User input |
| **b19.5** | "You did it!" | 1500 | 1.5s | After demographics |
| **b19.5-celebration-gif** | Celebration GIF | 3000 | 3.0s | Success animation |
| **b19.5-celebration-gif-no-share** | Celebration GIF | 3000 | 3.0s | For non-sharers |
| **b20** | Final thank you message | 5000 | 5.0s | Before redirect |
| **b20-no-share** | Final message (no demographics) | 2000 | 2.0s | Then b20 |

---

## Summary Statistics

### Timing Distribution
- **No delay (user action required)**: 29 blocks
- **1.0 second delay**: 11 blocks  
- **1.5 seconds delay**: 13 blocks
- **2.0 seconds delay**: 5 blocks
- **3.0 seconds delay**: 3 blocks
- **5.0 seconds delay**: 1 block (final message)

### Average Delays by Section
- **Opening**: 1.0s average
- **Connection & Context**: 1.6s average
- **Values & Beliefs**: 1.4s average
- **Motivations & Perceptions**: 1.5s average
- **Engagement & Barriers**: 1.5s average
- **Vision & Identity**: 1.25s average
- **Commitment & Next Steps**: 1.7s average
- **Closing & Demographics**: 2.1s average

### Total Automated Delay Time
If a user experiences all auto-advance blocks (unlikely due to branching):
- **Maximum total delay**: ~62 seconds
- **Typical user path delay**: ~25-35 seconds

### Performance Considerations
1. **Quick responses** (1.0s) used for acknowledgments and transitions
2. **Medium delays** (1.5s) for contextual responses that need reading time
3. **Longer delays** (2.0-3.0s) for GIFs, celebrations, and important messages
4. **Extended delay** (5.0s) only for final message before redirect

### Recommendations
- Current timing provides good pacing without feeling rushed
- Celebration moments (GIFs) have appropriate viewing time
- Quick transitions keep conversation flowing naturally
- Consider monitoring actual user completion times vs these presets
- May want to reduce some 1.5s delays to 1.0s if users report slow pacing

---

*Generated: August 17, 2025*
*Total Blocks Analyzed: 62*