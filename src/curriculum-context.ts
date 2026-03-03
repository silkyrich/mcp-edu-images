const SUBJECT_TERMS: Record<string, string[]> = {
  history: ["historical", "artefact", "primary source", "archive", "century"],
  geography: ["landscape", "aerial", "topography", "satellite", "terrain"],
  science: ["scientific", "laboratory", "specimen", "microscope", "experiment"],
  biology: ["biological", "organism", "cell", "anatomy", "wildlife"],
  chemistry: ["chemical", "molecule", "reaction", "element", "compound"],
  physics: ["physical", "force", "energy", "wave", "mechanics"],
  mathematics: ["diagram", "geometric", "graph", "chart", "mathematical"],
  english: ["illustration", "book", "manuscript", "literary", "text"],
  art: ["artwork", "painting", "sculpture", "gallery", "fine art"],
  music: ["musical instrument", "orchestra", "score", "performance"],
  "design and technology": ["design", "prototype", "engineering", "mechanism"],
  computing: ["computer", "circuit", "digital", "binary", "hardware"],
  "physical education": ["sport", "athletics", "exercise", "gymnasium"],
  "religious studies": ["religious", "temple", "mosque", "church", "sacred"],
};

const KS_AGE_TERMS: Record<string, string[]> = {
  ks1: ["children", "simple", "colourful", "clear"],
  ks2: ["educational", "labelled", "diagram"],
  ks3: ["detailed", "academic", "cross-section"],
  ks4: ["advanced", "technical", "professional"],
  eyfs: ["children", "simple", "bright", "playful"],
};

const IMAGE_TYPE_TERMS: Record<string, string[]> = {
  photo: ["photograph", "photo"],
  diagram: ["diagram", "illustration", "labelled", "schematic"],
  map: ["map", "cartography", "atlas", "geographic"],
  artwork: ["painting", "artwork", "fine art", "gallery"],
};

export function expandSearchTerms(
  query: string,
  subject?: string,
  keyStage?: string,
  imageType?: string
): string {
  // Only add ONE extra term to avoid over-constraining Wikimedia's full-text search.
  // Priority: image_type > subject (KS terms are too vague for image search).

  if (imageType) {
    const terms = IMAGE_TYPE_TERMS[imageType.toLowerCase()];
    if (terms) return `${query} ${terms[0]}`;
  }

  if (subject) {
    const terms = SUBJECT_TERMS[subject.toLowerCase()];
    if (terms) return `${query} ${terms[0]}`;
  }

  return query;
}
