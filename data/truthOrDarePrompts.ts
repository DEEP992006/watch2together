// Truth or Dare Prompts for Couples
export interface Prompt {
  type: 'truth' | 'dare';
  text: string;
  category?: 'romantic' | 'fun' | 'deep' | 'silly';
}

export const prompts: Prompt[] = [
  // Romantic Truths
  { type: 'truth', text: "What was your first impression of me?", category: 'romantic' },
  { type: 'truth', text: "What's your favorite memory of us together?", category: 'romantic' },
  { type: 'truth', text: "What do you love most about our relationship?", category: 'romantic' },
  { type: 'truth', text: "What song reminds you of me?", category: 'romantic' },
  { type: 'truth', text: "What's your favorite thing I do for you?", category: 'romantic' },
  { type: 'truth', text: "When did you first realize you had feelings for me?", category: 'romantic' },
  { type: 'truth', text: "What's your dream date with me?", category: 'romantic' },
  { type: 'truth', text: "What's one thing you want us to do together this year?", category: 'romantic' },
  { type: 'truth', text: "What makes you feel most loved by me?", category: 'romantic' },
  { type: 'truth', text: "What's your favorite physical feature of mine?", category: 'romantic' },
  
  // Fun Truths
  { type: 'truth', text: "What's the silliest thing you've ever done to impress me?", category: 'fun' },
  { type: 'truth', text: "What's your most embarrassing moment with me?", category: 'fun' },
  { type: 'truth', text: "If you could go anywhere in the world with me, where would it be?", category: 'fun' },
  { type: 'truth', text: "What's your secret guilty pleasure?", category: 'fun' },
  { type: 'truth', text: "What's the weirdest food you've ever eaten?", category: 'fun' },
  { type: 'truth', text: "What's your hidden talent that I don't know about?", category: 'fun' },
  { type: 'truth', text: "What's the most spontaneous thing you've ever done?", category: 'fun' },
  { type: 'truth', text: "What's your go-to karaoke song?", category: 'fun' },
  { type: 'truth', text: "What's the funniest joke you know?", category: 'fun' },
  { type: 'truth', text: "What's your favorite movie to watch with me?", category: 'fun' },
  
  // Deep Truths
  { type: 'truth', text: "What's your biggest dream in life?", category: 'deep' },
  { type: 'truth', text: "What's something you're afraid to tell me?", category: 'deep' },
  { type: 'truth', text: "What's the biggest lesson life has taught you?", category: 'deep' },
  { type: 'truth', text: "What do you see in our future together?", category: 'deep' },
  { type: 'truth', text: "What's your biggest insecurity?", category: 'deep' },
  { type: 'truth', text: "What's one thing you want to change about yourself?", category: 'deep' },
  { type: 'truth', text: "What's your biggest fear in our relationship?", category: 'deep' },
  { type: 'truth', text: "What makes you feel most vulnerable?", category: 'deep' },
  { type: 'truth', text: "What's the best advice you've ever received?", category: 'deep' },
  { type: 'truth', text: "What's your definition of true love?", category: 'deep' },
  
  // Romantic Dares
  { type: 'dare', text: "Give me your sweetest compliment right now.", category: 'romantic' },
  { type: 'dare', text: "Send me a virtual kiss emoji 💋", category: 'romantic' },
  { type: 'dare', text: "Tell me three things you love about me.", category: 'romantic' },
  { type: 'dare', text: "Dedicate a love song to me and sing a few lines.", category: 'romantic' },
  { type: 'dare', text: "Write me a short romantic poem on the spot.", category: 'romantic' },
  { type: 'dare', text: "Send me the most romantic emoji combination you can think of.", category: 'romantic' },
  { type: 'dare', text: "Tell me your favorite thing about my personality.", category: 'romantic' },
  { type: 'dare', text: "Describe our perfect day together in detail.", category: 'romantic' },
  { type: 'dare', text: "Send me a heart in the chat using text art.", category: 'romantic' },
  { type: 'dare', text: "Tell me why you chose me over everyone else.", category: 'romantic' },
  
  // Fun Dares
  { type: 'dare', text: "Do your best funny face on camera!", category: 'silly' },
  { type: 'dare', text: "Sing a song in a funny voice.", category: 'silly' },
  { type: 'dare', text: "Do your best animal impression.", category: 'silly' },
  { type: 'dare', text: "Tell me a corny pickup line.", category: 'silly' },
  { type: 'dare', text: "Do 10 jumping jacks right now!", category: 'fun' },
  { type: 'dare', text: "Send me 5 different emojis that describe our relationship.", category: 'fun' },
  { type: 'dare', text: "Tell me your most embarrassing story.", category: 'fun' },
  { type: 'dare', text: "Do your best dance move!", category: 'silly' },
  { type: 'dare', text: "Speak in an accent for the next 2 minutes.", category: 'silly' },
  { type: 'dare', text: "Send me the silliest selfie pose you can think of.", category: 'silly' },
  { type: 'dare', text: "Try to make me laugh in 30 seconds.", category: 'fun' },
  { type: 'dare', text: "Recreate a famous movie scene.", category: 'fun' },
  { type: 'dare', text: "Show me your best magic trick or create one!", category: 'fun' },
  { type: 'dare', text: "Do your best celebrity impression.", category: 'silly' },
  { type: 'dare', text: "Make up a rap about our relationship on the spot.", category: 'silly' },
  
  // Additional Mixed Prompts
  { type: 'truth', text: "What's the most romantic thing someone could do for you?", category: 'romantic' },
  { type: 'truth', text: "What's your love language?", category: 'deep' },
  { type: 'truth', text: "What's one thing you've always wanted to try with me?", category: 'fun' },
  { type: 'dare', text: "Plan our next date right now in the chat.", category: 'romantic' },
  { type: 'dare', text: "Send me the playlist of songs that remind you of us.", category: 'romantic' },
  { type: 'truth', text: "What's your favorite nickname I've given you?", category: 'romantic' },
  { type: 'truth', text: "What's the craziest dream you've had about us?", category: 'fun' },
  { type: 'dare', text: "Describe me using only food items.", category: 'silly' },
  { type: 'dare', text: "Send me a virtual bouquet using emojis.", category: 'romantic' },
  { type: 'truth', text: "What's something you admire about me?", category: 'deep' },
  { type: 'dare', text: "Compliment me without using the words 'beautiful' or 'handsome'.", category: 'romantic' },
  { type: 'truth', text: "What's your favorite inside joke we have?", category: 'fun' },
  { type: 'dare', text: "Tell me a story about a time you were proud of me.", category: 'romantic' },
  { type: 'truth', text: "What's the best gift I've ever given you?", category: 'romantic' },
  { type: 'dare', text: "Challenge me to a staring contest right now!", category: 'fun' },
  { type: 'truth', text: "What's your biggest pet peeve?", category: 'fun' },
  { type: 'dare', text: "Draw me in 30 seconds and show me!", category: 'silly' },
  { type: 'truth', text: "What's one thing about me that surprised you?", category: 'deep' },
  { type: 'dare', text: "Send me your best motivational speech.", category: 'fun' },
  { type: 'truth', text: "What's your favorite way to spend time with me?", category: 'romantic' },
];

// Helper function to get random prompt
export function getRandomPrompt(): Prompt {
  const randomIndex = Math.floor(Math.random() * prompts.length);
  return prompts[randomIndex];
}

// Helper function to get random prompt by type
export function getRandomPromptByType(type: 'truth' | 'dare'): Prompt {
  const filtered = prompts.filter(p => p.type === type);
  const randomIndex = Math.floor(Math.random() * filtered.length);
  return filtered[randomIndex];
}

// Helper function to get random prompt by category
export function getRandomPromptByCategory(category: string): Prompt {
  const filtered = prompts.filter(p => p.category === category);
  const randomIndex = Math.floor(Math.random() * filtered.length);
  return filtered[randomIndex];
}
