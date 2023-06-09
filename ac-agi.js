/*
Pardon the mess this was put together in half a day for the [lablab.ai](https://lablab.ai/event/autonomous-gpt-agents-hackathon) hackathon.
More updates to come

# AC AGI 
An autonomous general intelligence that accomplishes a task for you.
Uses human in the loop to provide feedback to the agent.


How to use:
- Enter your task
- Wait for the agent to complete the task
- Assign max-iterations for the agent to loop: 0 for infinite (probably not a good idea ¯\_(ツ)_/¯)
- Profit

Known issues:
- The agent will sometimes get stuck in a loop and not complete the task
- Human feedback is not always helpful

Upcoming features:
- More tools
- Refined prompts
- Better human feedback system
- Better memory system

Possible thanks to the fine folks at [Langchain](https://js.langchain.com/docs/use_cases/autonomous_agents/baby_agi#example-with-tools)
and all the other giants whose shoulders we stand on.
*/

// Name: AC AGI
// Description: An AGI task manager inspired by BabyAGI
// Author: Josh Mabry
// Twitter: @AI_Citizen

import "@johnlindquist/kit";

let { BabyAGI } = await import("langchain/experimental/babyagi");
let { MemoryVectorStore } = await import("langchain/vectorstores/memory");
let { OpenAIEmbeddings } = await import("langchain/embeddings/openai");
let { OpenAI } = await import("langchain/llms/openai");
let { PromptTemplate } = await import("langchain/prompts");
let { LLMChain } = await import("langchain/chains");
let { ChainTool } = await import("langchain/tools");
let { initializeAgentExecutorWithOptions } = await import("langchain/agents");
let { DynamicTool } = await import("langchain/tools");
let { ChatOpenAI } = await import("langchain/chat_models");
let { WebBrowser } = await import("langchain/tools/webbrowser");
let GOOGLE_API_KEY = await env("GOOGLE_API_KEY", {
  shortcuts: [
    {
      name: "Google API Key",
      key: `${cmd}+o`,
      bar: "right",
      onPress: () => {
        open("https://developers.google.com/custom-search/v1/introduction");
      },
    },
  ],
  ignoreBlur: true,
  secret: true,
  height: PROMPT.HEIGHT.INPUT_ONLY,
});

let GOOGLE_CSE_KEY = await env("GOOGLE_CSE_KEY", {
  shortcuts: [
    {
      name: "Google Custom Search Engine Key",
      key: `${cmd}+o`,
      bar: "right",
      onPress: () => {
        open("https://programmablesearchengine.google.com/");
      },
    },
  ],
  ignoreBlur: true,
  secret: true,
  height: PROMPT.HEIGHT.INPUT_ONLY,
});

await env("OPENAI_API_KEY", {
  hint: `Grab a key from <a href="https://platform.openai.com/account/api-keys">here</a>`,
});

const task = await arg({
  placeholder: "Task",
  description: "Enter a task for AC AGI to complete",
  ignoreBlur: true,
  height: PROMPT.HEIGHT.INPUT_ONLY,
});
let maxIterations = await arg({
  placeholder: "How many times should AC AGI loop?",
  hint: "Leave empty for infinite iterations *use with caution*",
  ignoreBlur: true,
  height: PROMPT.HEIGHT.INPUT_ONLY,
});

if (maxIterations === "" || maxIterations === "0") {
  maxIterations = undefined;
}

//#########################
// BabyAGI method overrides
//#########################
function printTaskList() {
  let result = "";
  for (const t of this.taskList) {
    result += `${t.taskID}: ${t.taskName}\n`;
  }
  const msg = `### Task List
  
  ${result}
  `;
  let html = md(msg);
  log(html);
  div({
    html,
    ignoreBlur: true,
  });
}

function printNextTask(task) {
  const msg = `### Next Task
  
  ${task.taskID}: ${task.taskName}
  `;
  let html = md(msg);
  log(html);
  div({
    html,
    ignoreBlur: true,
  });
}

function printTaskResult(result) {
  const msg = `### Task Result
  
  ${result.trim()}
  `;
  let html = md(msg);
  log(html);
  div({
    html,
    ignoreBlur: true,
  });
}

//#############
// Custom Tools
//#############
let html = (str) => str.replace(/ /g, "+");
let fetch = (q) =>
  `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CSE_KEY}&q=${html(
    q
  )}&sort=date`;

async function search(query) {
  let response = await get(fetch(query));

  let items = response?.data?.items;

  if (items) {
    let choices = items.map((item) => ({
      name: item.title,
      value: item.link,
    }));

    return JSON.stringify(choices);
  }
}

async function humanInput(question) {
  const response = await arg({
    placeholder: "Human, I need help!",
    hint: question,
    ignoreBlur: true,
    ignoreAbandon: true,
    height: PROMPT.HEIGHT.INPUT_ONLY,
  });
  return response;
}

async function processThought(thought) {
  let html = md(`## Thought
  ${thought.trim()}`);
  log(html);
  div({
    html,
    ignoreBlur: true,
  });
  return thought;
}

const todoPrompt = PromptTemplate.fromTemplate(
  "You are a planner/expert todo list creator. Generate a markdown formatted todo list for: {objective}"
);

const tools = [
  new ChainTool({
    name: "TODO",
    chain: new LLMChain({
      llm: new ChatOpenAI({ temperature: 0 }),
      prompt: todoPrompt,
    }),
    description:
      "Use to make a todo list. Input: users query. Output: the todo list",
  }),
  new DynamicTool({
    name: "Search",
    description: "Search web for information",
    func: search,
  }),
  new DynamicTool({
    name: "Human Input",
    description:
      "(Use only as last resort) Ask a human for specific input that you don't know, like a persons name, or DOB, location, etc. Input is question to ask human, output is answer",
    func: humanInput,
  }),
  // I've found that sometimes the agent just needs a dumping ground to rework its thoughts
  // this seems to help minimize LLM parsing errors
  new DynamicTool({
    name: "Thought Processing",
    description: `This is useful for when you have a thought that you want to use in a task, 
    but you want to make sure it's formatted correctly. 
    Input is your thought and self-critique and output is the processed thought.`,
    func: processThought,
  }),
];

//##################
// AC AGI is Born
//##################
const taskBeginMsg = md(`
### Executing Task Manager
Goal: ${task}
`);

div({ html: taskBeginMsg, ignoreBlur: true });

const agentExecutor = await initializeAgentExecutorWithOptions(
  tools,
  new ChatOpenAI({ modelName: "gpt-4", temperature: 0 }),
  {
    agentType: "zero-shot-react-description",
    agentArgs: {
      prefix: `You are an AI who performs one task based on the following objective: {objective}. 
Take into account these previously completed tasks: {context}.`,
      suffix: `Question: {task}
{agent_scratchpad}`,
      inputVariables: ["objective", "task", "context", "agent_scratchpad"],
    },
  }
);

const vectorStore = new MemoryVectorStore(new OpenAIEmbeddings());

const babyAGI = BabyAGI.fromLLM({
  llm: new ChatOpenAI({ temperature: 0 }),
  executionChain: agentExecutor,
  vectorstore: vectorStore,
  maxIterations: maxIterations,
});

babyAGI.printNextTask = printNextTask;
babyAGI.printTaskList = printTaskList;
babyAGI.printTaskResult = printTaskResult;

await babyAGI.call({ objective: task });
