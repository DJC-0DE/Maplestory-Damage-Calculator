function preprocessImage(imageURL, applyGrayscale = false, applySharpen = false, applyThreshold = false) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = imageURL;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = img.width * 3;
      canvas.height = img.height * 2;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const contrast = 1;
      const intercept = 128 * (1 - contrast);
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const avg = (r + g + b) / 3;
        if (avg > 180) {
          data[i] = data[i + 1] = data[i + 2] = 255;
        }
      }
      ctx.putImageData(imageData, 0, 0);
      if (applyGrayscale) {
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          let gray = 0.299 * r + 0.587 * g + 0.114 * b;
          gray = gray * contrast + intercept;
          data[i] = data[i + 1] = data[i + 2] = gray;
        }
        ctx.putImageData(imageData, 0, 0);
      }
      if (applySharpen) {
        const sharpenKernel = [
          0,
          -1,
          0,
          -1,
          5,
          -1,
          0,
          -1,
          0
        ];
        const sharpenedData = applyConvolution(imageData, sharpenKernel, canvas.width, canvas.height);
        ctx.putImageData(sharpenedData, 0, 0);
      }
      if (applyThreshold) {
        const threshold = 230;
        const thresholdedData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const thresholdedPixels = thresholdedData.data;
        for (let i = 0; i < thresholdedPixels.length; i += 4) {
          const value = thresholdedPixels[i] > threshold ? 255 : 0;
          thresholdedPixels[i] = thresholdedPixels[i + 1] = thresholdedPixels[i + 2] = value;
        }
        ctx.putImageData(thresholdedData, 0, 0);
      }
      resolve(canvas.toDataURL());
    };
  });
}
async function extractText(imageURL, debug = false) {
  const preprocessedImageURL = await preprocessImage(imageURL, true, true, true);
  const output = document.getElementById("debug-ocr");
  if (debug) {
    const originalLabel = document.createElement("div");
    originalLabel.innerHTML = `<strong>Original Image:</strong>`;
    output.appendChild(originalLabel);
    const originalImgElement = document.createElement("img");
    originalImgElement.src = imageURL;
    originalImgElement.style = "max-width: 100%; margin-bottom: 10px;";
    output.appendChild(originalImgElement);
    const preprocessedLabel = document.createElement("div");
    preprocessedLabel.innerHTML = `<strong>Preprocessed Image:</strong>`;
    output.appendChild(preprocessedLabel);
    const preprocessedImgElement = document.createElement("img");
    preprocessedImgElement.src = preprocessedImageURL;
    preprocessedImgElement.style = "max-width: 100%; margin-bottom: 10px;";
    output.appendChild(preprocessedImgElement);
  }
  try {
    const worker = await window.Tesseract.createWorker("eng");
    worker.setParameters({
      tessedit_pageseg_mode: 6
    });
    const { data: { text } } = await worker.recognize(preprocessedImageURL);
    if (debug) {
      const extractedTextLabel = document.createElement("div");
      extractedTextLabel.innerHTML = `<strong>Extracted Text:</strong>`;
      output.appendChild(extractedTextLabel);
      const extractedTextElement = document.createElement("div");
      extractedTextElement.textContent = text;
      output.appendChild(extractedTextElement);
    }
    return text;
  } catch (error) {
    console.error(error);
  } finally {
    URL.revokeObjectURL(imageURL);
  }
}
function applyConvolution(imageData, kernel, width, height) {
  const src = imageData.data;
  const output = new Uint8ClampedArray(src.length);
  const side = Math.round(Math.sqrt(kernel.length));
  const halfSide = Math.floor(side / 2);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dstOffset = (y * width + x) * 4;
      let r = 0, g = 0, b = 0;
      for (let ky = 0; ky < side; ky++) {
        for (let kx = 0; kx < side; kx++) {
          const scy = Math.min(height - 1, Math.max(0, y + ky - halfSide));
          const scx = Math.min(width - 1, Math.max(0, x + kx - halfSide));
          const srcOffset = (scy * width + scx) * 4;
          const weight = kernel[ky * side + kx];
          r += src[srcOffset] * weight;
          g += src[srcOffset + 1] * weight;
          b += src[srcOffset + 2] * weight;
        }
      }
      output[dstOffset] = Math.min(255, Math.max(0, r));
      output[dstOffset + 1] = Math.min(255, Math.max(0, g));
      output[dstOffset + 2] = Math.min(255, Math.max(0, b));
      output[dstOffset + 3] = src[dstOffset + 3];
    }
  }
  const result = new ImageData(output, width, height);
  return result;
}
function parseBaseStatText(text) {
  const displayNamesToInput = {
    "Attack": "attack-base",
    "Defense": "defense-base",
    "Critical Rate": "crit-rate-base",
    "Critical Damage": "crit-damage-base",
    "Attack Speed": "attack-speed-base",
    "STR": "str-base",
    "DEX": "dex-base",
    "LUK": "luk-base",
    "INT": "int-base",
    "Stat Prop. Damage": "stat-damage-base",
    "Damage": "damage-base",
    "Damage Amplification": "damage-amp-base",
    "Defense Penetration": "def-pen-base",
    "Boss Monster Damage": "boss-damage-base",
    "Normal Monster Damage": "normal-damage-base",
    "Min Damage Multiplier": "min-damage-base",
    // sometimes broken due to multi line 
    "Max Damage Multiplier": "max-damage-base",
    "1st Job Skill Lv.": "skill-level-1st-base",
    "2nd Job Skill Lv.": "skill-level-2nd-base",
    "3rd Job Skill Lv.": "skill-level-3rd-base",
    "4th Job Skill Lv.": "skill-level-4th-base",
    "Final Damage": "final-damage-base"
  };
  const cleanData = text.split("\n").map((x) => x.trim()).map((x) => x.split(" i ").join(" ")).map((x) => x.split(" ; ").join(" ")).filter((x, idx) => !(idx === 0 && !/\d/.test(x))).filter((x) => x).map((x) => {
    if (/^\d/.test(x)) {
      const matches2 = x.match(/^(\d\D*)(.*)$/);
      return [matches2[1].trim(), matches2[2].trim()];
    }
    const matches = x.match(/^(\D*)(.*)$/);
    return [matches[1].trim(), matches[2].trim()];
  }).reduce((acc, [label, value]) => {
    if (value === "") {
      if (acc.length > 1) {
        const prev = acc[acc.length - 1];
        prev[0] += ` ${label}`;
      }
    } else {
      acc.push([label, value]);
    }
    return acc;
  }, []).map((x) => {
    let value = x[1];
    if (value.includes("M") && value.includes("K")) {
      value = value.split(/\s+/).reduce((sum, part) => {
        const value2 = parseFloat(part);
        if (part.endsWith("M")) return sum + value2 * 1e6;
        if (part.endsWith("K")) return sum + value2 * 1e3;
        return sum;
      }, 0).toString();
    } else {
      value = value.split(",").join("").split("%").join("");
    }
    return [x[0], value];
  });
  let matchedData = cleanData.flatMap((x) => {
    const displayName = x[0];
    const value = x[1];
    for (const displayNameKey of Object.keys(displayNamesToInput).sort((a, b) => b.length - a.length)) {
      if (displayName.startsWith(displayNameKey)) {
        return [[displayNamesToInput[displayNameKey], value]];
      }
    }
    return [];
  });
  return matchedData;
}
export {
  extractText,
  parseBaseStatText,
  preprocessImage
};
//# sourceMappingURL=ocr.js.map
