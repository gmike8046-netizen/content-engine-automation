\# content-engine-automation



\## Local setup



\### Prerequisites

\- Node.js 18+

\- Git

\- An OpenAI API key



\### Steps



1\) Install dependencies:

npm install



2\) Create local environment file (do NOT commit this):

copy .env.example .env



Then edit `.env` and add your OpenAI API key.



3\) Run the local test:

npm run test:local



You should see a JSON object printed to the terminal containing:

\- status

\- notes

\- draft\_content

\- timestamps



