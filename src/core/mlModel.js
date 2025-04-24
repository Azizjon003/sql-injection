const tf = require("@tensorflow/tfjs-node");
const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");

class SQLInjectionModel {
  constructor() {
    this.model = null;
    this.loaded = false;
    this.vocabMap = new Map();
    this.maxSequenceLength = 50;
  }

  /**
   * Load the TensorFlow model and vocabulary
   */
  async loadModel() {
    try {
      const modelPath = path.join(__dirname, "../../model/sql-model");

      // Check if model directory exists
      if (!fs.existsSync(modelPath)) {
        logger.warn(
          "Model directory not found. Using fallback detection method."
        );
        return false;
      }

      // Load model
      this.model = await tf.loadLayersModel(`file://${modelPath}/model.json`);

      // Load vocabulary if it exists
      const vocabPath = path.join(modelPath, "vocab.json");
      if (fs.existsSync(vocabPath)) {
        const vocabData = JSON.parse(fs.readFileSync(vocabPath, "utf8"));
        this.vocabMap = new Map(Object.entries(vocabData));
      }

      this.loaded = true;
      logger.info("ML model loaded successfully");
      return true;
    } catch (error) {
      logger.error(`Failed to load ML model: ${error.message}`);
      return false;
    }
  }

  /**
   * Convert tokens to numeric sequences for model input
   * @param {string[]} tokens - Array of tokens
   * @returns {number[]} - Tokenized sequence
   */
  tokenizeSequence(tokens) {
    // If model not loaded, create a simple fallback
    if (!this.loaded) {
      return tokens.map((t) => t.charCodeAt(0) % 100);
    }

    // Convert tokens to indices
    return tokens.map((token) => {
      return this.vocabMap.has(token) ? this.vocabMap.get(token) : 0; // 0 for OOV (out of vocabulary)
    });
  }

  /**
   * Pad or truncate sequence to fixed length
   * @param {number[]} sequence - Input sequence
   * @returns {number[]} - Padded sequence
   */
  padSequence(sequence) {
    if (sequence.length >= this.maxSequenceLength) {
      return sequence.slice(0, this.maxSequenceLength);
    }

    return [
      ...sequence,
      ...Array(this.maxSequenceLength - sequence.length).fill(0),
    ];
  }

  /**
   * Predict if the input contains SQL injection
   * @param {string[]} tokens - Tokenized input string
   * @returns {Object} - Prediction result
   */
  async predict(tokens) {
    // If model not loaded yet, try to load it
    if (!this.loaded && !(await this.loadModel())) {
      // Fallback to heuristic detection if model can't be loaded
      return this.heuristicDetection(tokens);
    }

    try {
      // Prepare input for the model
      const sequence = this.tokenizeSequence(tokens);
      const paddedSequence = this.padSequence(sequence);

      // Convert to tensor and make prediction
      const inputTensor = tf.tensor2d(
        [paddedSequence],
        [1, this.maxSequenceLength]
      );
      const prediction = this.model.predict(inputTensor);

      // Get prediction value
      const confidence = await prediction.data();

      // Cleanup tensors
      inputTensor.dispose();
      prediction.dispose();

      return {
        isInjection: confidence[0] > 0.5,
        confidence: confidence[0],
      };
    } catch (error) {
      logger.error(`Error in ML prediction: ${error.message}`);
      // Fallback to heuristic detection if prediction fails
      return this.heuristicDetection(tokens);
    }
  }

  /**
   * Fallback heuristic detection when model is unavailable
   * @param {string[]} tokens - Tokenized input string
   * @returns {Object} - Detection result
   */
  heuristicDetection(tokens) {
    // Convert tokens to lowercase for case-insensitive matching
    const lowerTokens = tokens.map((t) => t.toLowerCase());

    // SQL injection keywords that might indicate an attack
    const suspiciousPatterns = [
      "union",
      "select",
      "from",
      "where",
      "drop",
      "update",
      "delete",
      "insert",
      "exec",
      "execute",
      "syscolumns",
      "sysobjects",
      "waitfor",
      "delay",
      "information_schema",
      "1=1",
      "or 1",
      "or true",
    ];

    // Count suspicious patterns
    let suspiciousCount = 0;
    for (const pattern of suspiciousPatterns) {
      if (lowerTokens.includes(pattern)) {
        suspiciousCount++;
      }
    }

    // Simple heuristic: if more than 2 suspicious patterns are found
    const confidence = Math.min(suspiciousCount / 3, 0.9);

    return {
      isInjection: confidence > 0.5,
      confidence,
    };
  }
}

module.exports = new SQLInjectionModel();
