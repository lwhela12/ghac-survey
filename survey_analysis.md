# GHAC Donor Survey - Comprehensive Analysis

Based on the Excel file analysis, here's the complete survey structure with questions, branching logic, and implementation requirements.

## Survey Overview

- **Total Blocks**: 23 (including sub-blocks)
- **Completion Time**: Target under 10 minutes
- **Video Questions**: 3 locations (blocks 1, 7, 12)
- **VideoAsk Integration**: Required for video/audio responses
- **Sections**: 7 main sections plus branching logic

## Complete Question Structure

### 1. Opening Section (Blocks 1-3)

#### Block 1: Video Welcome
- **Type**: Auto-play Video
- **Content**: Amanda Roy CEO introduction (45-60 seconds)
- **Logic**: Auto-play, no user interaction
- **Variable**: None

#### Block 2: Start Prompt
- **Type**: Quick Reply Buttons
- **Content**: Conversation introduction
- **Options**: 
  - 🎨 Let's start
  - 🤔 Tell me more first
- **Logic**: If "Tell me more first" → Extended info → Let's go button
- **Variable**: None

#### Block 3: Name Collection
- **Type**: Text Input
- **Content**: "What should I call you?"
- **Options**: First Name (Optional)
- **Logic**: If no name → "No problem! Let's get started."
- **Variable**: `@user_name`

### 2. Connection & Context Section (Blocks 4-5)

#### Block 4: GHAC Connection
- **Type**: Multiple Choice - Single Select
- **Content**: "What's your connection to Greater Hartford Arts Council?"
- **Options**:
  - I currently support GHAC
  - I've supported GHAC in the past
  - I participated through a workplace giving campaign
  - I'm connected through an artist or arts organization
  - This is my first time learning about GHAC
  - Other connection
- **Logic**: Branch responses based on selection → Block 4a
- **Variable**: `@connection_type`

#### Block 4a: Dynamic Response (Branch Logic)
- **Type**: Message/Text Input
- **Content**: Dynamic response based on connection type
- **Responses**:
  - Current support: "That's wonderful, {Name}! Thank you..."
  - Past support: "It's great to reconnect..."
  - Workplace: "Ah yes, the workplace giving programs!..."
  - First time: "Welcome, {Name}!..."
  - Other: "That's interesting! I'd love to hear more..." + Text Input
- **Logic**: Sets supporter status flags
- **Variables**: `@is_current_supporter`, `@is_past_supporter`, `@show_barriers`, `@show_giving_level`

#### Block 5: Arts Connection
- **Type**: Multiple Choice - Multi Select
- **Content**: "How do you currently connect with the arts in our region?"
- **Options**:
  - I attend performances, exhibitions, or events
  - I visit museums, galleries, or cultural sites
  - I have friends or family who are artists
  - I see arts as vital to community wellbeing
  - I donate to arts organizations
  - I believe arts education is essential
  - My work involves creative thinking
  - Other connection
- **Logic**: Dynamic response based on number selected
- **Variable**: `@arts_connections`

### 3. Values & Beliefs Section (Blocks 6-7)

#### Block 6: Arts Importance
- **Type**: Scale (1-5)
- **Content**: "How essential do you believe arts are in Greater Hartford?"
- **Options**:
  - 1️⃣ Nice to have, but not essential
  - 2️⃣ Somewhat important
  - 3️⃣ Important for quality of life
  - 4️⃣ Very important to our community
  - 5️⃣ Absolutely essential—like schools or healthcare
- **Logic**: Dynamic response based on rating
- **Variable**: `@arts_importance`

#### Block 7: Personal Arts Story (VIDEO QUESTION)
- **Type**: Mixed Response Options
- **Content**: "What's one way the arts have touched your life personally?"
- **Options**:
  - 🎥 Record a video (2 min max)
  - 🎤 Record audio (2 min max)
  - ⌨️ Type my response
  - 🤐 I'd prefer to skip this
- **Logic**: VideoAsk integration for video/audio options
- **Variable**: `@personal_story`

### 4. Motivations & Perceptions Section (Blocks 8-9)

#### Block 8: Giving Motivation (CONDITIONAL)
- **Type**: Multiple Choice - Single Select
- **Content**: Conditional text based on supporter status:
  - Current/Past: "What drives your giving decisions most?"
  - Non-supporter: "If you were to support an arts organization, what would be most important?"
- **Options**:
  - Knowing my support directly helps individual artists
  - Seeing measurable community impact
  - Ensuring arts access for underserved communities
  - Preserving our cultural heritage
  - Strengthening our creative economy
  - Investing in youth arts programs
  - Something else drives my decisions
- **Logic**: If "Something else" → Text input
- **Variable**: `@primary_motivation`

#### Block 9: GHAC Perception
- **Type**: Semantic Differential Scales (5 scales)
- **Content**: "Where would you place GHAC on these spectrums?"
- **Scales**:
  - Traditional ○○○○○ Innovative
  - Corporate ○○○○○ Community-focused
  - Transactional ○○○○○ Relationship-based
  - Behind the scenes ○○○○○ Visible catalyst
  - Exclusive ○○○○○ Inclusive
- **Logic**: 5 sub-scales saved as object
- **Variable**: `@ghac_perception`

### 5. Engagement & Barriers Section (Blocks 10-11)

#### Block 10: Ideal Relationship
- **Type**: Multiple Choice - Single Select
- **Content**: "What type of relationship would feel most meaningful to you?"
- **Options**:
  - Keep me informed and inspired
  - Invite me to special experiences
  - Include me in important decisions
  - Connect me with like-minded people
  - Let me support from a distance
  - Engage my professional skills
  - I'm still figuring that out
- **Variable**: `@ideal_relationship`

#### Block 11: Engagement Barriers (CONDITIONAL)
- **Type**: Multiple Choice - Multi Select
- **Content**: "What makes it challenging to engage with arts organizations?"
- **Options**:
  - Unclear how my support creates change
  - Don't feel personally welcomed
  - Financial constraints
  - Time constraints
  - Lack of information about opportunities
  - Past experiences felt impersonal
  - Life feels overwhelming right now
  - Other causes take priority
  - Nothing—I'm satisfied with my current level
- **Logic**: CONDITIONAL - Show only if not current supporter OR past supporter. Special response if "Nothing" selected
- **Variable**: `@engagement_barriers`

### 6. Vision & Identity Section (Blocks 12-14)

#### Block 12: Future Vision (VIDEO QUESTION)
- **Type**: Mixed Response Options
- **Content**: "If you could transform one thing about how arts organizations operate, what would it be?"
- **Options**:
  - 🎥 Record a video (2 min max)
  - 🎤 Record audio (2 min max)
  - ⌨️ Type my response
- **Logic**: VideoAsk integration
- **Variable**: `@future_vision`

#### Block 13: Creative Identity
- **Type**: Multiple Choice - Multi Select
- **Content**: "Which of these resonate with your personal relationship to creativity?"
- **Options**:
  - I pursue creative hobbies in my free time
  - I wish I had more creative outlets
  - Creative problem-solving is part of my work
  - I'm passionate about specific art forms
  - I see supporting artists as civic responsibility
  - Innovation and experimentation excite me
  - I believe traditional arts deserve preservation
- **Variable**: `@creative_identity`

#### Block 14: Arts Ecosystem Priorities
- **Type**: Ranking (Drag & Drop)
- **Content**: "What would you most like to see strengthen in Greater Hartford's arts ecosystem?"
- **Options**:
  - More opportunities for emerging artists
  - Arts education for young people
  - Public art that reflects our diversity
  - Sustainable funding for arts organizations
  - Creative spaces for artists to work and gather
  - Arts as economic development driver
  - Connections between arts and wellness/healing
- **Logic**: Select top 3 priorities
- **Variable**: `@top_priorities`

### 7. Commitment & Next Steps Section (Blocks 15-16)

#### Block 15: Interest Areas
- **Type**: Multiple Choice - Multi Select
- **Content**: "What specific opportunities might interest you in the next year?"
- **Options**:
  - Learning about artists and their stories
  - Behind-the-scenes studio visits
  - Donor gatherings and salons
  - Sharing my professional expertise
  - Advisory committee participation
  - Monthly or quarterly giving
  - Hosting a friend-raising event
  - I need to learn more first
- **Variable**: `@interests`

#### Block 16: Communication Preference
- **Type**: Multiple Choice - Single Select
- **Content**: "How would you prefer to hear from us?"
- **Options**:
  - Email updates with stories and impact
  - Text messages about events and opportunities
  - Future conversations like this one
  - Printed newsletter (quarterly)
  - Social media updates
  - I'd prefer not to receive updates
  - A mix of these
- **Logic**: Branch to appropriate contact form based on selection → Block 16a
- **Variable**: `@communication_pref`

#### Block 16a: Contact Forms (CONDITIONAL)
- **Type**: Contact Form
- **Content**: Contact information collection based on communication preference
- **Forms**:
  - Email: First Name*, Last Name*, Email*, Mobile (optional)
  - Text: First Name*, Last Name*, Mobile*, Email*
  - Newsletter: First Name*, Last Name*, Email*, Full Address*
  - Mix: First Name*, Last Name*, Email*, Mobile (optional)
- **Logic**: Only shows for relevant preferences
- **Variables**: `@user_firstname`, `@user_lastname`, `@user_email`, `@user_mobile`, `@user_address`

### 8. Closing & Demographics Section (Blocks 17-20)

#### Block 17: Conversation Value
- **Type**: Scale (1-5)
- **Content**: "How valuable was this conversation for you?"
- **Options**:
  - 1️⃣ Not valuable
  - 2️⃣ Somewhat valuable
  - 3️⃣ Valuable
  - 4️⃣ Very valuable
  - 5️⃣ Extremely valuable—I'm glad we connected
- **Variable**: `@conversation_value`

#### Block 18: Demographics Consent
- **Type**: Yes/No Buttons
- **Content**: "Would you be willing to share a bit more about yourself?"
- **Options**:
  - Yes, I'll share
  - I'd prefer not to
- **Logic**: If "Yes" → Continue to demographics, If "No" → Skip to thank you
- **Variable**: `@demographics_consent`

#### Block 19: Demographics (CONDITIONAL)
- **Type**: Various
- **Content**: Demographics questions (OPTIONAL - only if consent given)
- **Questions**:
  - ZIP code (Text)
  - Age range (Multiple choice)
  - Giving level (Multiple choice - conditional)
  - Race/ethnicity (Multi-select)
  - Gender identity (Multiple choice)
- **Logic**: Giving level only shows if current/past supporter
- **Variables**: `@user_zip`, `@user_age`, `@giving_level`, `@race_ethnicity`, `@gender_identity`

#### Block 19.2: Contact Permission
- **Type**: Multiple Choice
- **Content**: "May we reach out about relevant opportunities?"
- **Options**:
  - Yes, please keep me in the loop
  - Not right now, but maybe later
  - No thank you
- **Logic**: Only shows after demographics
- **Variable**: `@contact_permission`

#### Block 20: Final Thank You
- **Type**: Final Message + Buttons
- **Content**: Final thank you message
- **Options**:
  - Explore GHAC's current programs
  - Close for now
- **Logic**: End of survey

## Key Branching Logic & Conditional Flow

### 1. Supporter Status Flags (Block 4a)
- Sets multiple variables based on connection type
- Affects questions 8, 11, and demographics giving level
- Current/past supporters see different question text

### 2. Video/Audio Integration (Blocks 7, 12)
- VideoAsk API integration required
- 2-minute maximum for recordings
- Alternative text input always available
- Skip option available for personal story

### 3. Contact Form Logic (Block 16a)
- Dynamic form fields based on communication preference
- Required fields vary by preference type
- Address collection only for newsletter preference

### 4. Demographics Conditional (Blocks 18-19.2)
- Entire demographics section behind consent gate
- Giving level question only for current/past supporters
- Contact permission only shows after demographics

### 5. Engagement Barriers Conditional (Block 11)
- Only shows for non-current supporters OR past supporters
- Special handling if "Nothing" is selected

## Technical Implementation Requirements

### Question Types Needed
1. **Auto-play Video** - Welcome video
2. **Quick Reply Buttons** - Simple choice buttons
3. **Text Input** - Name, other responses
4. **Multiple Choice - Single Select** - Radio buttons
5. **Multiple Choice - Multi Select** - Checkboxes
6. **Scale (1-5)** - Rating scale with emoji labels
7. **Mixed Response Options** - Video/Audio/Text choices
8. **Semantic Differential Scales** - 5-point scales with opposing labels
9. **Ranking (Drag & Drop)** - Prioritization of options
10. **Yes/No Buttons** - Binary choice
11. **Contact Form** - Dynamic form fields
12. **Message** - Display-only content

### VideoAsk Integration Points
- Block 1: Auto-play welcome video
- Block 7: Personal story (video/audio/text/skip options)
- Block 12: Future vision (video/audio/text options)

### State Management Requirements
- User name personalization throughout
- Supporter status flags affecting multiple questions
- Progress tracking (halfway point mentioned at Block 7)
- Save state on every answer for resumption

### Conditional Logic Implementation
```typescript
// Example branching conditions
{
  questionId: "q11", // Engagement barriers
  showIf: {
    not: { variable: "@is_current_supporter", equals: true },
    or: { variable: "@is_past_supporter", equals: true }
  }
},
{
  questionId: "q19_giving_level", // Demographics giving level
  showIf: {
    and: [
      { variable: "@demographics_consent", equals: true },
      { 
        or: [
          { variable: "@is_current_supporter", equals: true },
          { variable: "@is_past_supporter", equals: true }
        ]
      }
    ]
  }
}
```

## Variable Mapping for Database

All variables should be stored with their @ prefix removed:
- `@user_name` → `user_name`
- `@connection_type` → `connection_type`
- `@arts_connections` → `arts_connections` (array)
- `@ghac_perception` → `ghac_perception` (object with 5 scales)
- `@top_priorities` → `top_priorities` (ranked array)

## Progress Tracking

- Total questions: ~20 (excluding conditional/branch blocks)
- Halfway point: Block 7 (mentioned in script)
- Save progress after each answer
- Allow resumption from last completed question