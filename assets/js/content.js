/* =============================================================================
   EDIT ME — every word, name, caption and photo choice on the site lives here.
   -----------------------------------------------------------------------------
   • Change text between the quotes. Keep the commas and brackets as they are.
   • Names and the date are set once, just below, and reused everywhere.
   • Photos live in  assets/photos/ . To swap one, drop a new file there and
     change its "src" in the PHOTOS list. width/height are optional and only
     help the page reserve space while photos load.
   • Any place that says  photo: "someKey"  picks a photo from the PHOTOS list.
   • Music (optional): put an .mp3 in  assets/music/  and write its path in
     MUSIC.src below, e.g. "assets/music/birthday.mp3". A music button and a
     mute button then appear in the top bar. With no file, nothing is shown.
   ============================================================================= */
(function () {
  "use strict";

  /* ---- Names & date ------------------------------------------------------ */
  const FRIEND = "Sana";
  const ME = "Asad";
  const DATE = "6 November";
  const DIALOGUE = "app to sbb jantyyy haa"; // keep this exact spelling

  /* ---- Photos ------------------------------------------------------------ */
  const PHOTOS = {
    nightThumbsUp: {
      src: "assets/photos/night-thumbs-up.jpg", width: 960, height: 1280,
      alt: "Two friends in black outfits giving a thumbs up at night in front of a lit stone wall",
    },
    bougainvillea: {
      src: "assets/photos/bougainvillea-trio.jpg", width: 887, height: 1183,
      alt: "Three friends standing in front of red bougainvillea flowers on a sunny day",
    },
    laughing: {
      src: "assets/photos/laughing.jpg", width: 960, height: 1280,
      alt: "A close-up of a big, scrunched-eye laugh, head resting on a table",
    },
    selfie: {
      src: "assets/photos/selfie-brown-jacket.jpg", width: 962, height: 1280,
      alt: "A playful selfie in a black hijab and brown jacket, hand posed under the chin",
    },
    pinkAndYellow: {
      src: "assets/photos/pink-and-yellow.jpg", width: 740, height: 1516,
      alt: "A smiling portrait in a bright pink hijab and a yellow floral outfit, hands clasped",
    },
    thumbsUpOutdoors: {
      src: "assets/photos/thumbs-up-outdoors.jpg", width: 590, height: 1208,
      alt: "A smiling double thumbs up outdoors, in a flowing grey-green outfit",
    },
    sunglasses: {
      src: "assets/photos/sunglasses-indoors.jpg", width: 960, height: 1280,
      alt: "Wearing sunglasses indoors and smiling, in a black hijab",
    },
    gardenPath: {
      src: "assets/photos/garden-path.jpg", width: 960, height: 1280,
      alt: "Posing on a paved garden path under green trees, in a pink floral outfit",
    },
    parkFriends: {
      src: "assets/photos/park-friends.jpg", width: 1200, height: 1600,
      alt: "Three friends posing playfully on a green lawn, one twirling in yellow with a pink scarf",
    },
    officialPortrait: {
      src: "assets/photos/official-portrait.jpg", width: 573, height: 852,
      alt: "A very serious, very official portrait against a blue background",
    },
  };

  /* ---- Little moving memories (videos). Remove items to hide them; an empty
          list hides the whole film strip. ------------------------------------ */
  const VIDEOS = [
    { src: "assets/videos/campus-walk.mp4", poster: "assets/videos/campus-walk.jpg", width: 848, height: 480, caption: "Campus walks and a lot of laughing." },
    { src: "assets/videos/lab-day.mp4", poster: "assets/videos/lab-day.jpg", width: 480, height: 848, caption: "Lab days." },
    { src: "assets/videos/road-trip.mp4", poster: "assets/videos/road-trip.jpg", width: 848, height: 480, caption: "Road trips and car selfies." },
    { src: "assets/videos/night-ride.mp4", poster: "assets/videos/night-ride.jpg", width: 480, height: 848, caption: "Late-night rides with the whole group." },
    { src: "assets/videos/group-shoot.mp4", poster: "assets/videos/group-shoot.jpg", width: 480, height: 848, caption: "Group photo mode: activated." },
    { src: "assets/videos/no-explanation.mp4", poster: "assets/videos/no-explanation.jpg", width: 506, height: 900, caption: "No explanation will be provided. 😂" },
    { src: "assets/videos/three-seconds.mp4", poster: "assets/videos/three-seconds.jpg", width: 506, height: 900, caption: "Three seconds of pure nonsense." },
    { src: "assets/videos/official-photo.mp4", poster: "assets/videos/official-photo.jpg", width: 415, height: 900, caption: "Very serious. Very official. 😌" },
  ];

  /* ---- Optional music ----------------------------------------------------- */
  const MUSIC = { src: "" }; // e.g. "assets/music/birthday.mp3"

  /* ========================================================================= */
  window.BIRTHDAY_CONTENT = {
    names: { friend: FRIEND, me: ME },
    date: DATE,
    dialogue: DIALOGUE,
    photos: PHOTOS,
    videos: VIDEOS,
    music: MUSIC,

    meta: {
      pageTitle: `${FRIEND}’s Birthday Surprise`,
    },

    ui: {
      backToGifts: "Back to the gifts",
      giftsButton: "Gifts",
      secretsLabel: "Little secrets found:",
      hintButton: "Hint",
      close: "Close",
      keepExploring: "Keep exploring",
      previous: "Previous",
      next: "Next",
      enlarge: "Enlarge photo",
      turnOver: "turn me over",
      turnBack: "turn back",
      playClip: "Play clip",
      musicPlay: "Play music",
      musicPause: "Pause music",
      mute: "Mute",
      unmute: "Unmute",
    },

    /* 2 · Opening ------------------------------------------------------------ */
    opening: {
      above: "Some friendships begin at university… and slowly become family.",
      envelope: `For ${FRIEND} — from your university partner in nonsense 💌`,
      below: "A few memories, a few surprises, and something I wanted to say.",
      openButton: `Open it, ${FRIEND} 👀`,
      cardPeek: `Happy Birthday, ${FRIEND}! 🎂`,
      stampPhoto: "nightThumbsUp",
      peekPhotos: ["thumbsUpOutdoors", "bougainvillea"],
      reveal: {
        title: `Happy Birthday, ${FRIEND}! 🎂`,
        date: `${DATE} — a whole day dedicated to someone who apparently already knows everything.`,
        bubble: `${DIALOGUE} 😂`,
        line: "From university memories to a friendship that feels like siblings — this little surprise is for you.",
        button: "Show me what you’ve planned 🎁",
        photo: "selfie",
      },
    },

    /* 3 · Three little gifts -------------------------------------------------- */
    gifts: {
      heading: "Three little gifts",
      intro: "Some things will make you laugh. Some might make you a little emotional. You’ve been warned.",
      hint: "Look closely. I’ve hidden a few things around here.",
      openedLabel: "opened · tap to revisit",
      items: {
        memories: { label: "Our university memories", note: "maybe start here" },
        cake: { label: "A wish for your new chapter", note: "" },
        letter: { label: "From your best friend", note: "save this one for last" },
      },
    },

    /* 4 · University memories ---------------------------------------------------- */
    memories: {
      heading: "University gave us memories. Somewhere along the way, we became family. 📸",
      intro: "We spent so much time together, enjoyed so much, and made memories that still mean a lot to me. Looking back, those ordinary days feel pretty special.",
      tapHint: "Tap a photo to see it bigger. Some of them have something written on the back.",
      // Order = order on the page. "back" makes a polaroid flippable.
      // "sticker: true" puts hidden note 2 beside that photo (use it on one of our photos).
      polaroids: [
        { photo: "nightThumbsUp", caption: "Best friend then. Family now.", back: "I’m really glad we got to share this part of life.", sticker: true },
        { photo: "laughing", caption: "So much time together. So many reasons to laugh." },
        { photo: "bougainvillea", caption: "Those university days.", back: "What made those days special was the company." },
        { photo: "thumbsUpOutdoors", caption: `Obviously, ${DIALOGUE} 😂` },
        { photo: "selfie", caption: "A little photo, a whole lot of memories." },
        { photo: "sunglasses", caption: "Sunglasses indoors. Very serious university business. 😎" },
        { photo: "pinkAndYellow", caption: "Some moments stay with you.", back: "This chapter will always be one of my favourites." },
        { photo: "parkFriends", caption: "Never a dull day." },
        { photo: "gardenPath", caption: "Main-character energy. Don’t let it go to your head. 😌" },
      ],
      reelHeading: "Little moving memories",
      reelHint: "Tap a clip to play it (with sound).",
      next: "Next: a very important question →",
    },

    /* 5 · A little fun before the emotional part --------------------------------- */
    fun: {
      eyebrow: "A little fun before the emotional part",
      title: "A very important question…",
      question: "Who already knows absolutely everything?",
      answerYes: `${FRIEND}, obviously.`,
      answerThink: "Let me think…",
      responseYes: `Correct. ${DIALOGUE} 😂`,
      responseThink: "Why are you thinking? We already know the answer.",
      certificate: {
        title: "Official Certificate of Knowing Everything",
        presented: `Presented to ${FRIEND} by ${ME}, who has heard enough to confirm this.`,
        smallPrint: "Valid until someone asks where she put her phone.",
        photo: "officialPortrait",
        signatureLabel: "Signed",
        dateLabel: "Dated",
      },
      continue: "Continue to the cake 🎂",
      continueLetter: "Continue to the letter 💌",
    },

    /* 6 · Cake & wish ----------------------------------------------------------------- */
    cake: {
      heading: "A little wish for the chapter ahead ✨",
      text: "Before you continue, take a moment and make a wish for yourself. Something you really hope this next chapter brings.",
      button: "Wish made. Blow out the candles 🕯️",
      tapHint: "(or tap the candles one by one)",
      wish: "May this new chapter bring you happiness that feels peaceful, opportunities that excite you, and people who appreciate you. May you feel proud of yourself, even while you’re still figuring things out.",
      wishTease: "And may you occasionally allow someone else to know something too. 😂",
      photo: "gardenPath",
      photoCaption: "Here’s to the next chapter.",
      next: "Next: a letter from your best friend 💌",
    },

    /* 7 · Five hidden notes ---------------------------------------------------------- */
    secrets: {
      total: 5,
      items: [
        {
          id: 1, where: "opening", photo: "bougainvillea",
          label: "A twinkling star",
          note: "University gave me a best friend. Time made that friendship feel like family.",
          hint: "A star is twinkling beside the very first envelope.",
        },
        {
          id: 2, where: "memories", photo: "laughing",
          label: "A heart sticker",
          note: "If I could revisit those university days for a little while, I’d happily choose another day of laughing with you.",
          hint: "One of our photos has a sticker that isn’t just decoration.",
        },
        {
          id: 3, where: "fun", photo: "sunglasses",
          label: "The gold stamp",
          note: `One thing you might not know, even though ‘${DIALOGUE}’: I appreciate your friendship more than I probably say.`,
          hint: "Every official certificate has a gold stamp. Press it.",
          lockedHint: "First, answer a very important question.",
        },
        {
          id: 4, where: "cake", photo: "pinkAndYellow",
          label: "The cherry on the cake",
          note: "My quiet wish for you: that the next chapter gives you plenty of reasons to smile.",
          hint: "The cherry on top is not just for decoration.",
        },
        {
          id: 5, where: "letter", photo: "thumbsUpOutdoors",
          label: "The wax seal",
          note: "Whatever changes around us, you’ll always have a best friend and an unofficial brother cheering for you.",
          hint: "Look beneath my letter. It’s sealed for a reason.",
        },
      ],
      noteLabel: "Little secret {n} of 5",
      hintsTitle: "Little secrets",
      hintsIntro: "Found {found} of 5. Here’s where to look:",
      hintsAllFound: "You found all five.",
      takeMeThere: "Take me there",
      readAgain: "Read it again",
      readBonus: "Read the bonus message",
      bonus: {
        lines: [
          "You found every secret. Of course you did…",
          `${DIALOGUE} 😂`,
          `But seriously, ${FRIEND} — I’m really glad we became friends.`,
        ],
        photo: "parkFriends",
      },
    },

    /* 8 · The letter ------------------------------------------------------------------- */
    letter: {
      envelopeLabel: `For ${FRIEND}`,
      title: `To ${FRIEND}, my crime patner  💌`,
      photo: "nightThumbsUp",
      photoCaption: "Thumbs up for this friendship. 👍",
      paragraphs: [
        `Happy Birthday, ${FRIEND}!`,
        "I was thinking about how much time we spent together at university and how much fun we had. Back then, we were simply enjoying those days. Looking back now, I realise how many memories we were making without even noticing.",
        "University ki woh memories hamesha special rahengi — especially because you’re such a big part of them.",
        "Somewhere between spending all that time together, laughing, and getting to know each other, you became more than a university friend. You became someone I think of as family. Our bond feels like siblings now, complete with the teasing and the fact that I’m obviously going to annoy you occasionally.",
        "As you step into this new chapter of your life, I feel happy for you, and a little emotional too. I hope there are beautiful things waiting for you: new experiences, good people, and moments when you stop and think, ‘I’m really happy here.’",
        "I hope you feel proud of yourself. I hope you give yourself time when things feel unfamiliar. And I hope you remember that you don’t have to have everything figured out immediately.",
        `Although, of course… ${DIALOGUE} 😂`,
        "Life will keep moving, and there will be new routines and new memories. But the time we shared will always matter to me. I’m grateful that university brought us together, and even more grateful that our friendship became something this close.",
        "Whenever you want to share good news, talk something through, or laugh about something completely pointless, I’ll be happy to hear from you.",
        `Thank you for all the fun, the memories, and the friendship, ${FRIEND}. I hope this birthday is the beginning of a year that treats you kindly and gives you so much to look forward to.`,
        "Enjoy your day. Eat the cake. Accept the compliments. And please leave a little knowledge for the rest of us.",
        `Happy Birthday, ${FRIEND}. You’ll always have a best friend and an unofficial brother in me.`,
      ],
      signature: `— ${ME}`,
      sealLabel: "A wax seal",
      endLine: "One last memory. One last wish.",
      endButton: "Okay, show me ✨",
    },

    /* 9 · Final surprise -------------------------------------------------------------- */
    final: {
      lines: [
        "We met at university.",
        "We spent so much time together.",
        "We laughed and made memories.",
        "And somewhere along the way…",
        "You became family.",
      ],
      title: `Happy Birthday, ${FRIEND}.`,
      wish: "May your next chapter be full of happiness, good people, and memories you’ll love.",
      signoff: `Always cheering for you,\n${ME} 🤍`,
      bubble: `Emotional ho gayi? Chalo, ${DIALOGUE} 😂`,
      // Photos hung on the fairy-light strings, in order.
      photos: ["nightThumbsUp", "laughing", "bougainvillea", "thumbsUpOutdoors", "pinkAndYellow", "selfie", "parkFriends", "sunglasses", "gardenPath"],
      againButton: "Look through our memories again",
      replayButton: "Replay my birthday surprise",
    },
  };
})();
