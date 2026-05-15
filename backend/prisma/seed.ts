import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Body Templates...');

  const bodyTemplates = [
    {
      name: 'slim_male',
      gender: 'male',
      bodyType: 'slim',
      displayName: 'Slim Male',
      svgBase: '<svg viewBox="0 0 200 400"></svg>',
      boneMap: {
        head: { x: 100, y: 40, r: 30 },
        neck: { x: 100, y: 80 },
        torso: { x: 100, y: 150, w: 50, h: 120 },
        leftArm: { x1: 75, y1: 100, x2: 40, y2: 180, children: { forearm: { x2: 30, y2: 240 } } },
        rightArm: { x1: 125, y1: 100, x2: 160, y2: 180, children: { forearm: { x2: 170, y2: 240 } } },
        leftLeg: { x1: 85, y1: 260, x2: 70, y2: 350 },
        rightLeg: { x1: 115, y1: 260, x2: 130, y2: 350 },
      },
    },
    {
      name: 'average_male',
      gender: 'male',
      bodyType: 'average',
      displayName: 'Average Male',
      svgBase: '<svg viewBox="0 0 200 400"></svg>',
      boneMap: {
        head: { x: 100, y: 45, r: 32 },
        neck: { x: 100, y: 85 },
        torso: { x: 100, y: 160, w: 60, h: 130 },
        leftArm: { x1: 70, y1: 110, x2: 35, y2: 190 },
        rightArm: { x1: 130, y1: 110, x2: 165, y2: 190 },
        leftLeg: { x1: 80, y1: 280, x2: 65, y2: 370 },
        rightLeg: { x1: 120, y1: 280, x2: 135, y2: 370 },
      },
    },
    {
      name: 'fat_male',
      gender: 'male',
      bodyType: 'fat',
      displayName: 'Heavyset Male',
      svgBase: '<svg viewBox="0 0 200 400"></svg>',
      boneMap: {
        head: { x: 100, y: 45, r: 34 },
        neck: { x: 100, y: 85 },
        torso: { x: 100, y: 170, w: 80, h: 140 },
        leftArm: { x1: 60, y1: 120, x2: 30, y2: 200 },
        rightArm: { x1: 140, y1: 120, x2: 170, y2: 200 },
        leftLeg: { x1: 75, y1: 300, x2: 60, y2: 390 },
        rightLeg: { x1: 125, y1: 300, x2: 140, y2: 390 },
      },
    },
    {
      name: 'slim_female',
      gender: 'female',
      bodyType: 'slim',
      displayName: 'Slim Female',
      svgBase: '<svg viewBox="0 0 200 400"></svg>',
      boneMap: {
        head: { x: 100, y: 40, r: 28 },
        neck: { x: 100, y: 75 },
        torso: { x: 100, y: 150, w: 42, h: 120 },
        leftArm: { x1: 79, y1: 100, x2: 45, y2: 180 },
        rightArm: { x1: 121, y1: 100, x2: 155, y2: 180 },
        leftLeg: { x1: 87, y1: 260, x2: 72, y2: 350 },
        rightLeg: { x1: 113, y1: 260, x2: 128, y2: 350 },
      },
    },
    {
      name: 'average_female',
      gender: 'female',
      bodyType: 'average',
      displayName: 'Average Female',
      svgBase: '<svg viewBox="0 0 200 400"></svg>',
      boneMap: {
        head: { x: 100, y: 42, r: 30 },
        neck: { x: 100, y: 78 },
        torso: { x: 100, y: 155, w: 50, h: 125 },
        leftArm: { x1: 75, y1: 105, x2: 40, y2: 185 },
        rightArm: { x1: 125, y1: 105, x2: 160, y2: 185 },
        leftLeg: { x1: 84, y1: 270, x2: 70, y2: 360 },
        rightLeg: { x1: 116, y1: 270, x2: 130, y2: 360 },
      },
    },
    {
      name: 'child',
      gender: 'neutral',
      bodyType: 'child',
      displayName: 'Child',
      svgBase: '<svg viewBox="0 0 200 400"></svg>',
      boneMap: {
        head: { x: 100, y: 50, r: 35 },
        neck: { x: 100, y: 90 },
        torso: { x: 100, y: 170, w: 45, h: 100 },
        leftArm: { x1: 78, y1: 120, x2: 48, y2: 190 },
        rightArm: { x1: 122, y1: 120, x2: 152, y2: 190 },
        leftLeg: { x1: 88, y1: 260, x2: 78, y2: 340 },
        rightLeg: { x1: 112, y1: 260, x2: 122, y2: 340 },
      },
    },
  ];

  const createdBodies = [];
  for (const bt of bodyTemplates) {
    const created = await prisma.bodyTemplate.upsert({
      where: { name: bt.name },
      update: {},
      create: {
        name: bt.name,
        gender: bt.gender,
        bodyType: bt.bodyType,
        displayName: bt.displayName,
        svgBase: bt.svgBase,
        boneMap: bt.boneMap,
        thumbnailUrl: `https://assets.autodraft-clone.dev/templates/body_${bt.name}.png`,
      },
    });
    createdBodies.push(created);
  }

  console.log(`Seeded ${createdBodies.length} body templates.`);

  // Motion presets per body type — Phase 1 static poses only
  const motionData = [
    { name: 'idle', displayName: 'Idle Standing', category: 'body', durationSec: 1, frameCount: 1 },
    { name: 'walk', displayName: 'Walking', category: 'body', durationSec: 2, frameCount: 1 },
    { name: 'sit', displayName: 'Sitting', category: 'body', durationSec: 1, frameCount: 1 },
    { name: 'talk', displayName: 'Talking', category: 'face', durationSec: 1, frameCount: 1 },
    { name: 'angry_point', displayName: 'Angry Pointing', category: 'combined', durationSec: 1, frameCount: 1 },
    { name: 'cry', displayName: 'Crying', category: 'face', durationSec: 1, frameCount: 1 },
    { name: 'laugh', displayName: 'Laughing', category: 'face', durationSec: 1, frameCount: 1 },
    { name: 'sit_talk', displayName: 'Sitting & Talking', category: 'combined', durationSec: 1, frameCount: 1 },
    { name: 'sad', displayName: 'Sad', category: 'face', durationSec: 1, frameCount: 1 },
    { name: 'shocked', displayName: 'Shocked', category: 'face', durationSec: 1, frameCount: 1 },
    { name: 'happy', displayName: 'Happy', category: 'face', durationSec: 1, frameCount: 1 },
    { name: 'sleeping', displayName: 'Sleeping', category: 'body', durationSec: 1, frameCount: 1 },
    { name: 'eating', displayName: 'Eating', category: 'combined', durationSec: 1, frameCount: 1 },
    { name: 'waving', displayName: 'Waving', category: 'body', durationSec: 1, frameCount: 1 },
    { name: 'running', displayName: 'Running', category: 'body', durationSec: 2, frameCount: 1 },
  ];

  const countBefore = await prisma.motionPreset.count();
  for (const body of createdBodies) {
    for (const motion of motionData) {
      await prisma.motionPreset.upsert({
        where: { id: `${body.name}_${motion.name}` }, // composite key workaround
        update: {},
        create: {
          id: `${body.name}_${motion.name}`,
          name: motion.name,
          displayName: motion.displayName,
          bodyTemplateId: body.id,
          category: motion.category,
          durationSec: motion.durationSec,
          frameCount: motion.frameCount,
          boneKeyframes: {},
          thumbnailUrl: `https://assets.autodraft-clone.dev/motions/${body.name}_${motion.name}.png`,
        },
      });
    }
  }
  const countAfter = await prisma.motionPreset.count();
  console.log(`Seeded ${(countAfter - countBefore) / createdBodies.length} motion presets per body type.`);

  // Background templates
  const backgrounds = [
    { name: 'bedroom_day', category: 'indoor', prompt: 'cartoon anime style bedroom, bright daylight, clean bed and window, flat colors, simple background', imageUrl: 'https://assets.autodraft-clone.dev/bg/bedroom_day.png' },
    { name: 'bedroom_night', category: 'indoor', prompt: 'cartoon anime style bedroom, night time, lamp light, cozy atmosphere, flat colors', imageUrl: 'https://assets.autodraft-clone.dev/bg/bedroom_night.png' },
    { name: 'kitchen_day', category: 'indoor', prompt: 'cartoon anime style kitchen, bright daylight, stove and fridge visible, flat colors', imageUrl: 'https://assets.autodraft-clone.dev/bg/kitchen_day.png' },
    { name: 'kitchen_night', category: 'indoor', prompt: 'cartoon anime style kitchen, warm night light, dinner table, flat colors', imageUrl: 'https://assets.autodraft-clone.dev/bg/kitchen_night.png' },
    { name: 'living_room_day', category: 'indoor', prompt: 'cartoon anime style living room, TV and sofa, daylight from window, flat colors', imageUrl: 'https://assets.autodraft-clone.dev/bg/living_room_day.png' },
    { name: 'classroom', category: 'indoor', prompt: 'cartoon anime style classroom, whiteboard and desks, school atmosphere, flat colors', imageUrl: 'https://assets.autodraft-clone.dev/bg/classroom.png' },
    { name: 'hospital_room', category: 'indoor', prompt: 'cartoon anime style hospital room, bed and medical equipment, calm atmosphere, flat colors', imageUrl: 'https://assets.autodraft-clone.dev/bg/hospital_room.png' },
    { name: 'street_day', category: 'outdoor', prompt: 'cartoon anime style city street, sidewalk and buildings, bright daylight, flat colors', imageUrl: 'https://assets.autodraft-clone.dev/bg/street_day.png' },
    { name: 'park_day', category: 'outdoor', prompt: 'cartoon anime style park, bench and trees, sunny daylight, people walking, flat colors', imageUrl: 'https://assets.autodraft-clone.dev/bg/park_day.png' },
    { name: 'park_night', category: 'outdoor', prompt: 'cartoon anime style park at night, street lamps, romantic atmosphere, flat colors', imageUrl: 'https://assets.autodraft-clone.dev/bg/park_night.png' },
    { name: 'forest_path', category: 'outdoor', prompt: 'cartoon anime style forest path, green trees, mystery atmosphere, flat colors', imageUrl: 'https://assets.autodraft-clone.dev/bg/forest_path.png' },
    { name: 'beach_day', category: 'outdoor', prompt: 'cartoon anime style beach, blue ocean and sand, clear sky, flat colors', imageUrl: 'https://assets.autodraft-clone.dev/bg/beach_day.png' },
    { name: 'school_gate', category: 'outdoor', prompt: 'cartoon anime style school entrance gate, students walking, daylight, flat colors', imageUrl: 'https://assets.autodraft-clone.dev/bg/school_gate.png' },
    { name: 'market', category: 'outdoor', prompt: 'cartoon anime style traditional market, stalls and crowd, busy atmosphere, flat colors', imageUrl: 'https://assets.autodraft-clone.dev/bg/market.png' },
    { name: 'restaurant', category: 'indoor', prompt: 'cartoon anime style restaurant, tables and chairs, indoor dining, flat colors', imageUrl: 'https://assets.autodraft-clone.dev/bg/restaurant.png' },
  ];

  for (const bg of backgrounds) {
    await prisma.backgroundTemplate.upsert({
      where: { name: bg.name },
      update: {},
      create: {
        name: bg.name,
        category: bg.category,
        prompt: bg.prompt,
        style: 'cartoon',
        imageUrl: bg.imageUrl,
      },
    });
  }
  console.log(`Seeded ${backgrounds.length} background templates.`);

  console.log('Seed complete.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
