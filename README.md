[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template/5pJ6WI?referralCode=stefa-n)
## medusa-stonkers
![Medusa Hackathon 2022](https://i.imgur.com/nmkzzB3.jpg)

## About

### Participants
Stefan - [@stefa-n](https://github.com/stefa-n "@stefa-n") <br>
Feely - [@Feely3007](https://github.com/Feely3007) <br>
Campake - [@penktastal](https://github.com/penktastal)

### Description

Stonkers brings shop owners closer to their customers by providing an integration between Discord & Medusajs 

### Preview
#### https://twitter.com/stef4n24/status/1577641389797564417
#### https://twitter.com/stef4n24/status/1578824627161559040
#### https://twitter.com/stef4n24/status/1580976701764354048

## Set up Project

### Prerequisites
Before you start with the tutorial make sure you have

- [Node.js](https://nodejs.org/en/) v16.9.0 or greater installed on your machine
- Medusa fully set up

### Install Project

1. Clone the repository:
```bash
git clone https://github.com/superstashed/medusa-stonkers
```

2. Configuration:
Change the configuration to your liking.

3. Create a MySQL table called discord with: 
* column called discord of type BIGINT
* column called cookie of type TEXT

4. Change directory and install dependencies:
```bash
cd medusa-stonkers
npm install
```

5. Run!
```bash
node .
```

## Resources
- [Medusa’s GitHub repository](https://github.com/medusajs/medusa)
- [Medusa Documentation](https://docs.medusajs.com/)
- [Discord.js' Documentation](https://discord.js.org/#/docs/discord.js/main/general/welcome)

## Notes
- If you'd like to save tickets (change it in config.json) make sure you have enabled the "Message Content" Intent in your Discord Developer Portal under the "Bot" category
