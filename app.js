const noteForm = document.querySelector("#note-form");
const noteTitle = document.querySelector("#note-title");
const noteBody = document.querySelector("#note-body");
const notesList = document.querySelector("#notes-list");
const summaryOutput = document.querySelector("#summary-output");
const aiPrompt = document.querySelector("#ai-prompt");
const aiGenerate = document.querySelector("#ai-generate");
const aiSummarize = document.querySelector("#ai-summarize");
const clearForm = document.querySelector("#clear-form");
const clearNotes = document.querySelector("#clear-notes");

const STORAGE_KEY = "jotter-notes";
let notes = [];
let activeNoteId = null;

const loadNotes = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      notes = JSON.parse(stored);
    } catch (error) {
      console.error("Failed to parse stored notes:", error);
      notes = [];
      localStorage.removeItem(STORAGE_KEY);
    }
  }
};

const saveNotes = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
};

const formatDate = (timestamp) =>
  new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));

const setActiveNote = (id) => {
  activeNoteId = id;
  renderNotes();
};

const resetForm = () => {
  noteTitle.value = "";
  noteBody.value = "";
  activeNoteId = null;
};

const buildSummary = (text) => {
  if (!text.trim()) {
    return "Add content to generate a summary.";
  }

  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => sentence.trim().length > 0);

  const summary = sentences.slice(0, 2).join(" ");
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const highlight = wordCount > 50 ? `Top takeaways from ${wordCount} words:` : "Quick summary:";

  return `${highlight} ${summary}`;
};

const buildGeneratedNote = (prompt) => {
  const basePrompt = prompt.trim() || "Daily highlight";
  const sections = [
    "Key update",
    "Progress made",
    "Next steps",
    "Open questions",
  ];

  const bullets = sections
    .map((section, index) => `• ${section}: ${basePrompt} – detail ${index + 1}.`)
    .join("\n");

  return `AI Draft: ${basePrompt}\n\n${bullets}`;
};

const addNote = (title, content) => {
  const now = Date.now();
  const newNote = {
    id: crypto.randomUUID(),
    title,
    content,
    createdAt: now,
    updatedAt: now,
  };

  notes.unshift(newNote);
  saveNotes();
  setActiveNote(newNote.id);
};

const updateNote = (id, updates) => {
  notes = notes.map((note) =>
    note.id === id
      ? {
          ...note,
          ...updates,
          updatedAt: Date.now(),
        }
      : note
  );
  saveNotes();
  renderNotes();
};

const deleteNote = (id) => {
  notes = notes.filter((note) => note.id !== id);
  if (activeNoteId === id) {
    activeNoteId = notes[0]?.id ?? null;
  }
  saveNotes();
  renderNotes();
};

const renderNotes = () => {
  notesList.innerHTML = "";

  if (!notes.length) {
    const empty = document.createElement("p");
    empty.className = "summary-output";
    empty.textContent = "No notes yet. Create one to get started.";
    notesList.appendChild(empty);
    return;
  }

  notes.forEach((note) => {
    const card = document.createElement("article");
    card.className = "note-card";
    if (note.id === activeNoteId) {
      card.classList.add("active");
    }

    const title = document.createElement("h3");
    title.textContent = note.title;

    const preview = document.createElement("p");
    preview.textContent = note.content.slice(0, 140);

    const meta = document.createElement("p");
    meta.className = "note-meta";
    meta.textContent = `Updated ${formatDate(note.updatedAt)}`;

    const actions = document.createElement("div");
    actions.className = "note-actions";

    const selectBtn = document.createElement("button");
    selectBtn.className = "ghost";
    selectBtn.textContent = "Open";
    selectBtn.addEventListener("click", () => {
      noteTitle.value = note.title;
      noteBody.value = note.content;
      setActiveNote(note.id);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => deleteNote(note.id));

    actions.append(selectBtn, deleteBtn);

    card.append(title, preview, meta, actions);
    card.addEventListener("click", () => setActiveNote(note.id));

    notesList.appendChild(card);
  });
};

noteForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = noteTitle.value.trim();
  const content = noteBody.value.trim();

  if (!title || !content) {
    return;
  }

  if (activeNoteId) {
    updateNote(activeNoteId, { title, content });
  } else {
    addNote(title, content);
  }

  resetForm();
});

clearForm.addEventListener("click", resetForm);

clearNotes.addEventListener("click", () => {
  notes = [];
  activeNoteId = null;
  saveNotes();
  renderNotes();
  summaryOutput.textContent =
    'Select a note and click "AI: Summarize current note" to get a quick overview.';
});

aiGenerate.addEventListener("click", () => {
  const generated = buildGeneratedNote(aiPrompt.value);
  noteTitle.value = aiPrompt.value.trim() || "AI Generated Note";
  noteBody.value = generated;
});

aiSummarize.addEventListener("click", () => {
  const content = noteBody.value.trim();
  summaryOutput.textContent = buildSummary(content);
});

loadNotes();
renderNotes();
