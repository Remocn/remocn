export type Reason = {
  title: string;
  detail: string;
};

export const REASONS: Reason[] = [
  {
    title: "No motion designer",
    detail:
      "A demo video normally runs $600 and two weeks of back-and-forth. This one costs a prompt and an afternoon.",
  },
  {
    title: "No After Effects",
    detail:
      "Nothing to install, nothing to learn. If you can describe the video you want, you can make it.",
  },
  {
    title: "No keyframes",
    detail:
      "The animation is already built and already timed. Your agent picks the pieces, you react to the result.",
  },
  {
    title: "Not a screen recording",
    detail:
      "A cursor wandering across your app isn’t a demo. This looks like something you shipped on purpose.",
  },
  {
    title: "Yours to keep",
    detail:
      "The code copies into your repo and stays there. MIT, no runtime, no account, nothing to cancel.",
  },
  {
    title: "Changes in seconds",
    detail:
      "Say what feels wrong and watch it change. No revision round, no waiting on someone else’s queue.",
  },
];

export type HowItWorksStep = {
  title: string;
  detail: string;
};

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    title: "Open an AI agent in an empty folder",
    detail: "Claude Code, Cursor, ChatGPT — whichever one you already use.",
  },
  {
    title: "Paste one prompt",
    detail:
      "It sets up the project, installs the Remocn skill and opens a preview.",
  },
  {
    title: "A player opens in your browser",
    detail: "That’s your video. Say what to change and it changes.",
  },
];

export type FaqItem = {
  question: string;
  answer: string;
};

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Do I need to know how to code?",
    answer:
      "No, but you’ll be working through an AI coding agent. If you’ve used Claude Code, Cursor or ChatGPT to build something before, you’re already set. If not, the setup guide walks you through it in about ten minutes.",
  },
  {
    question: "Do I need After Effects or a video editor?",
    answer:
      "No. Everything happens in your browser and your agent. Nothing else to install, nothing else to learn.",
  },
  {
    question: "What am I actually installing?",
    answer:
      "A small video project on your machine, plus the pieces your video uses. Your agent sets it up. Nothing runs on our servers and nothing phones home.",
  },
  {
    question: "Can I change things after it’s built?",
    answer:
      "Yes, by saying what to change. The preview updates while you watch, so you react to the video instead of guessing at settings.",
  },
  {
    question: "Is it free?",
    answer:
      "MIT. Everything copies onto your machine and it’s yours — no account, no runtime, no lock-in.",
  },
  {
    question: "How long does the first video take?",
    answer:
      "An afternoon while you get the hang of it. After that, under an hour.",
  },
];
