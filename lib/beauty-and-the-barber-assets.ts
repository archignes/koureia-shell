const ASSET_BASE = "/assets/beauty-and-the-barber"

type AssetCategory = {
  label: string
  description: string
  files: string[]
}

export const beautyAndTheBarberAssetCategories: AssetCategory[] = [
  {
    label: "Brand",
    description: "Logo files from the earlier Curiosity Build demo.",
    files: [
      "beautyandthebarber-logo-2026-03-15T21-09-51-2283c49d.jpg",
      "beautyandthebarber-logo-black-2026-03-15T21-09-49-d5274b81.png",
    ],
  },
  {
    label: "Staff",
    description: "Provider profile images used in the earlier B&B Koureia demo.",
    files: [
      "Cassie-Profile-2026-03-16T12-37-20-55f7039b.jpg",
      "Enzo-Profile-2026-03-16T12-37-25-c6bd43ff.jpg",
      "Christina-Profile-2026-03-16T12-37-30-1c770d06.jpg",
    ],
  },
  {
    label: "Beauty Portfolio",
    description: "Hair color, extensions, cuts, and head-spa imagery scraped for the original demo.",
    files: [
      "Color-Correction-Blonde-001-2026-03-15T21-10-11-400c10b6.jpg",
      "Color-Treatment-Balayage-001-2026-03-15T21-10-13-c9b24907.jpg",
      "Color-Treatment-Balayage-002-2026-03-15T21-10-14-30357f0d.jpg",
      "Color-Treatment-Balayage-003-2026-03-15T21-10-15-48feff2a.jpg",
      "Color-Treatment-Balayage-004-2026-03-15T21-10-17-080bc0c9.jpg",
      "Color-Treatment-Balayage-005-2026-03-15T21-10-18-4adb10a5.jpg",
      "Color-Treatment-Burgundy-001-2026-03-15T21-10-20-1c7918e9.jpg",
      "Color-Treatment-Lavendar-001-2026-03-15T21-10-21-402578b4.jpg",
      "Color-Treatment-Lavendar-003-2026-03-15T21-10-22-fef45386.jpg",
      "Color-Treatment-Mermaid-001-2026-03-15T21-10-26-7d5b7ad1.jpg",
      "Color-Treatment-Neon-Melt-001-2026-03-15T21-10-29-7b7bec9a.jpg",
      "Color-Treatment-Pink-002-2026-03-15T21-10-31-c81f3e40.jpg",
      "Color-Treatment-Platinum-001-2026-03-15T21-10-32-028ea8a4.jpg",
      "Color-Treatment-Platinum-002-2026-03-15T21-10-34-627b3bc7.jpg",
      "Color-Treatment-Purple-001-2026-03-15T21-10-35-6ad01e2d.jpg",
      "Color-Treatment-Red-001-2026-03-15T21-10-39-485dbf13.jpg",
      "Color-Treatment-Red-Gold-Melt-001-2026-03-15T21-10-40-89d60052.jpg",
      "Color-Treatment-Unicorn-001-2026-03-15T21-10-41-710586ac.jpg",
      "HairCut-Style-Curls-001-2026-03-15T21-10-43-d9f9a8cd.jpg",
      "Hair-Extensions-001-2026-03-15T21-10-44-8462c12f.jpg",
      "Hair-Extensions-002-2026-03-15T21-10-46-e5112ccc.jpg",
      "Hair-Extensions-003-2026-03-15T21-10-47-5611ca7a.jpg",
      "Hair-Extensions-Balayage-001-2026-03-15T21-10-52-b016fd04.jpg",
      "Head-Spa-2026-03-15T21-09-52-56afdd2f.webp",
    ],
  },
  {
    label: "Barber Portfolio",
    description: "Cuts, fades, tapers, and beard imagery from the earlier demo asset set.",
    files: [
      "Barber-Cut-09-2026-03-15T21-11-36-6ae49ba0.jpg",
      "Barber-Cut-10-2026-03-15T21-11-42-43fe05ed.jpg",
      "Barber-Cut-11-2026-03-15T21-11-44-000656e3.JPG",
      "Barber-Cut-12-2026-03-15T21-11-33-c27b264d.JPG",
      "Barber-Cut-13-2026-03-15T21-11-24-c8f2ae79.JPG",
      "Barber-Cut-15-2026-03-15T21-11-46-b7cea50a.JPG",
      "Barber-Cut-16-2026-03-15T21-11-49-a1b553a6.JPG",
      "Barber-Cut-17-2026-03-15T21-11-50-83072008.JPG",
      "Barber-Cut-19-2026-03-15T21-10-54-38bba181.JPG",
      "Barber-Cut-20-2026-03-15T21-10-57-eafbe6f7.JPG",
      "Barber-Cut-21-2026-03-15T21-11-00-a9924215.JPG",
      "Barber-Cut-22-2026-03-15T21-11-05-492bc481.JPG",
      "Fade-01-2026-03-15T21-11-27-07143960.jpg",
      "Fade-02-2026-03-15T21-11-14-ff8291e3.jpg",
      "Taper-01-2026-03-15T21-11-29-477a251a.jpg",
      "Taper-Fade-01-2026-03-15T21-11-30-120ef53e.jpg",
      "Barber-Cut-26-2026-03-15T21-11-20-43adacfd.jpg",
      "Barber-Cut-27-2026-03-15T21-11-22-53c7de9b.jpg",
      "Barber-Cut-28-2026-03-15T21-11-56-6142ef9b.jpg",
      "Barber-Cut-30-2026-03-15T21-11-17-d88cf4e4.jpg",
    ],
  },
  {
    label: "Interior",
    description: "Salon interior and atmosphere images from the earlier B&B asset library.",
    files: [
      "BandB-Salon-01-2026-03-15T21-09-54-b824373f.JPG",
      "BandB-Salon-02-2026-03-15T21-10-01-92f80138.JPG",
      "BandB-Salon-03-2026-03-15T21-10-02-ab73ca78.JPG",
      "BandB-Salon-04-2026-03-15T21-09-59-1cde51c5.JPG",
      "BandB-Salon-06-2026-03-15T21-09-56-33d79980.JPG",
      "BandB-Salon-09-2026-03-15T21-09-53-e3452b3a.JPG",
      "BandB-Salon-10-2026-03-15T21-10-08-d46870b5.JPG",
      "New-Salon-001-2026-03-15T21-10-05-cb735e1f.jpg",
      "New-Salon-008-2026-03-15T21-10-04-9ea7624a.jpg",
    ],
  },
]

export const beautyAndTheBarberAssets = beautyAndTheBarberAssetCategories.flatMap((category) =>
  category.files.map((file) => ({
    ...category,
    file,
    src: `${ASSET_BASE}/${file}`,
  })),
)

