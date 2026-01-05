export function generateDCI() {
    // Demo: simple deterministic output (later enhance with rules)
    const dciScore = Math.floor(65 + Math.random() * 25); // 65-90
    const recommendationType = dciScore > 80 ? "inspect" : "pest_check";
  
    const explanationSummary =
      recommendationType === "inspect"
        ? "High-confidence stress indicators detected in the latest scan. Recommend physical inspection."
        : "Moderate confidence irregular patterns detected. Recommend pest check or additional scans.";
  
    return { dciScore, recommendationType, explanationSummary };
  }
  