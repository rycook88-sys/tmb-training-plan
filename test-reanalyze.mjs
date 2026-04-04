import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";

const client = createTRPCClient({
  links: [
    httpBatchLink({
      url: "http://localhost:3000/api/trpc",
      transformer: superjson,
    }),
  ],
});

async function main() {
  console.log("Calling reAnalyze with the exact food description...\n");
  
  const result = await client.nutrition.reAnalyze.mutate({
    foodName: "Mixed protein bowl (ground beef, shredded chicken, cheese, salsa), roasted broccoli, and seasoned roasted potatoes with Coke Zero",
    servingEstimate: "1 full plate",
  });

  console.log("=== RESULT ===");
  console.log("Food Name:", result.foodName);
  console.log("Calories:", result.calories);
  console.log("Protein:", result.protein, "g");
  console.log("Carbs:", result.carbs, "g");
  console.log("Fat:", result.fat, "g");
  console.log("Fiber:", result.fiber, "g");
  console.log("Sodium:", result.sodium, "mg");
  console.log("\n=== MICRONUTRIENTS ===");
  
  if (result.micronutrients && Array.isArray(result.micronutrients)) {
    // Sort by name for readability
    const sorted = [...result.micronutrients].sort((a, b) => a.name.localeCompare(b.name));
    for (const m of sorted) {
      console.log(`  ${m.name}: ${m.amountMg} ${m.unit}`);
    }
    console.log(`\nTotal micronutrients returned: ${result.micronutrients.length}`);
    
    // Check specifically for Vitamin K
    const vitK = result.micronutrients.find(m => m.name === "Vitamin K");
    if (vitK) {
      console.log(`\n✅ Vitamin K IS present: ${vitK.amountMg} ${vitK.unit}`);
    } else {
      console.log(`\n❌ Vitamin K is MISSING from the response!`);
    }
  } else {
    console.log("No micronutrients returned!");
  }
}

main().catch(console.error);
