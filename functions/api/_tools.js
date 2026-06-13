// functions/api/_tools.js
// =============================================================================
// PLACEHOLDER — future "tools" / function-calling layer for the support bot.
// NOTHING here is active yet. The chat backend imports TOOLS but keeps it
// disabled (see ENABLE_TOOLS in chat.js), so the bot never claims a capability
// that does not exist behind it.
//
// HOW WORKERS AI FUNCTION CALLING WILL WORK (the pattern to follow later):
//   1. Pass the tool schemas to the model:
//        env.AI.run(MODEL, { messages, max_tokens, tools: TOOLS })
//   2. If the model decides to call a tool, the result carries `tool_calls`:
//        result.tool_calls === [{ name: 'get_order_status', arguments: {...} }]
//   3. Run the REAL function for each call (runToolCalls below), then append
//      each result to the conversation as a { role: 'tool', ... } message.
//   4. Call env.AI.run(MODEL, { messages: [...history, ...toolMessages] }) again
//      so the model can answer the user using the live tool output.
//
// Each tool is a JSON-schema description of name + purpose + parameters.
// Keep TOOLS empty until the API behind a tool is actually live.
// =============================================================================

export const TOOLS = [
  // ---- EXAMPLE (left commented until an order-status API exists) ------------
  // Order tracking is the first planned tool. When the order backend is ready,
  // uncomment this schema AND implement the matching case in runToolCalls().
  //
  // {
  //   type: 'function',
  //   function: {
  //     name: 'get_order_status',
  //     description: 'Look up the current status of a customer order by order number and email.',
  //     parameters: {
  //       type: 'object',
  //       properties: {
  //         order_number: { type: 'string', description: 'Order number, e.g. AN-12345' },
  //         email:        { type: 'string', description: 'Email address used for the order' }
  //       },
  //       required: ['order_number', 'email']
  //     }
  //   }
  // }
];

// Stub dispatcher — wire real implementations here later. Receives the model's
// `tool_calls` and returns the messages to append back into the conversation.
export async function runToolCalls(toolCalls, env) {
  const toolMessages = [];
  for (const call of toolCalls || []) {
    switch (call.name) {
      // case 'get_order_status': {
      //   const data = await lookupOrder(call.arguments, env); // your real API
      //   toolMessages.push({ role: 'tool', name: call.name, content: JSON.stringify(data) });
      //   break;
      // }
      default:
        toolMessages.push({
          role: 'tool',
          name: call.name,
          content: 'This tool is not implemented yet.'
        });
    }
  }
  return toolMessages;
}
