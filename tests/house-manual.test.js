var manual = require("../js/house-manual.js");
var slugs = [
  "app-report-a-problem",
  "front-group-arrival",
  "front-departure-billing",
  "hk-turnaround",
  "kitchen-allergen-plate",
  "house-service-recovery",
  "house-fire-evacuation",
  "house-medical-emergency"
];

function fail(msg) { throw new Error(msg); }

slugs.forEach(function (slug) {
  var ch = manual.chapterBySlug(slug);
  if (!ch) fail("missing " + slug);
  if (ch.steps.length < 4) fail(slug + " needs at least 4 steps");
  ch.steps.forEach(function (step, i) {
    if (!step[1] || !step[2]) fail(slug + " step " + i + " needs look and act");
  });
  if (!ch.body || !ch.summary || !ch.diagram.length) fail(slug + " is incomplete");
});

if (!/999/.test(manual.chapterBySlug("house-fire-evacuation").body)) fail("fire chapter names 999");
if (!/may contain/i.test(manual.chapterBySlug("kitchen-allergen-plate").body)) fail("allergen chapter names may contain");
if (manual.chapters.length !== 8) fail("expected 8 chapters");

console.log("house manual tests passed");
