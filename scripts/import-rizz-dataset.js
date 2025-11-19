const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function fetchRizzDataset() {
  try {
    console.log('Fetching rizz dataset from Hugging Face...');
    
    // Fetch sequentially with adaptive delays
    const batchSize = 100;
    const totalToFetch = 55422; // Fetch ALL conversations from dataset
    const totalBatches = Math.ceil(totalToFetch / batchSize);
    
    console.log(`Fetching ALL ${totalToFetch} conversations in ${totalBatches} batches...`);
    console.log(`Estimated time: ${Math.ceil(totalBatches * 0.4 / 60)} minutes with adaptive rate limiting`);
    
    const allRows = [];
    let delay = 400; // Start with 400ms delay
    let consecutiveSuccesses = 0;
    
    for (let i = 0; i < totalBatches; i++) {
      const progress = Math.round((i / totalBatches) * 100);
      if (i % 20 === 0) {
        console.log(`Progress: ${progress}% - Batch ${i + 1}/${totalBatches} (${allRows.length} conversations, delay: ${delay}ms)...`);
      }
      
      try {
        const response = await axios.get(
          `https://datasets-server.huggingface.co/rows?dataset=the-rizz/the-rizz-corpus&config=default&split=train&offset=${i * batchSize}&length=${batchSize}`
        );
        
        if (response.data && response.data.rows) {
          allRows.push(...response.data.rows);
          consecutiveSuccesses++;
          
          // Reduce delay if we're having consistent success
          if (consecutiveSuccesses > 10 && delay > 250) {
            delay = Math.max(250, delay - 25);
          }
        }
      } catch (err) {
        consecutiveSuccesses = 0;
        
        // Handle rate limiting
        if (err.response && err.response.status === 429) {
          delay = Math.min(5000, delay * 2); // Exponential backoff up to 5s
          console.log(`Rate limited at batch ${i}, increasing delay to ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          i--; // Retry this batch
          continue;
        } else {
          console.error(`Error fetching batch ${i}:`, err.message);
        }
      }
      
      // Delay between requests
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    if (!allRows || allRows.length === 0) {
      console.error('No data found in response');
      return;
    }

    console.log(`Found ${allRows.length} total conversations`);

    // Parse conversations and extract examples
    const examples = [];
    
    for (const row of allRows) {
      const conversation = row.row.text;
      
      // Parse the conversation format
      // Format: <<SYS>>...persona...<</SYS>> <s>[INST]prompt[/INST]response</s>
      
      // Extract system prompt (personas)
      const sysMatch = conversation.match(/<<SYS>>(.*?)<\/SYS>>/s);
      const systemPrompt = sysMatch ? sysMatch[1].trim() : '';
      
      // Extract first exchange
      const firstExchange = conversation.match(/<s>\[INST\](.*?)\[\/INST\](.*?)<\/s>/s);
      
      if (firstExchange) {
        const userMessage = firstExchange[1].trim();
        const assistantMessage = firstExchange[2].trim();
        
        // Skip if too short or not meaningful
        if (userMessage.length < 10 || assistantMessage.length < 10) {
          continue;
        }
        
        // Create example
        examples.push({
          context: systemPrompt,
          prompt: userMessage,
          response: assistantMessage,
          effectiveness: 0.7 // Default rating
        });
      }
      
      // Also extract follow-up exchanges
      const followUps = conversation.matchAll(/<s>\[INST\](.*?)\[\/INST\](.*?)<\/s>/gs);
      let exchangeCount = 0;
      for (const match of followUps) {
        exchangeCount++;
        if (exchangeCount === 1) continue; // Skip first (already added)
        if (exchangeCount > 3) break; // Only take first few exchanges
        
        const userMsg = match[1].trim();
        const assistantMsg = match[2].trim();
        
        if (userMsg.length >= 10 && assistantMsg.length >= 10) {
          examples.push({
            context: `Follow-up in conversation. ${systemPrompt}`,
            prompt: userMsg,
            response: assistantMsg,
            effectiveness: 0.7
          });
        }
      }
    }

    console.log(`Extracted ${examples.length} examples`);
    
    // Save to file
    const outputPath = path.join(__dirname, 'rizz-examples.json');
    fs.writeFileSync(outputPath, JSON.stringify(examples, null, 2));
    console.log(`Saved examples to ${outputPath}`);
    
    return examples;
  } catch (error) {
    console.error('Error fetching dataset:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

fetchRizzDataset();
