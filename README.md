Outdated, please visit [https://github.com/artificialcitizens/ac-scripts](https://github.com/artificialcitizens/ac-scripts) for up to date scripts and install instructions
# AC AGI

AC AGI is a proof of concept of leveraging BabyAGI and human feedback to complete a users tasks. This what built in less than 24hrs for the LabLab.ai x Langchain hackathon

Leveraging the [Langchain](https://docs.langchain.com/docs/) library, [ScriptKit](https://www.scriptkit.com/) and [ChatGPT](https://platform.openai.com/), I've created a system that sets off on a user provided task and queries the user for input when it gets a question it needs help with.

It has the ability to Google for results as well as scrape a Website for the information.

## How to Install

install [https://www.scriptkit.com/](https://www.scriptkit.com/)
install script [here](https://github.com/johnlindquist/kit/discussions/1231)

you'll be prompted to install libs and enter api-tokens follow steps there for api info

## How to use:

- Enter your task
- Wait for the agent to complete the task
- Assign max-iterations for the agent to loop: 0 for infinite (probably not a good idea ¯\_(ツ)\_/¯)
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
