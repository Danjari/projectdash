Milestone 04 - Final Project Documentation
===
udjah
NetID
---
mm12515

Name
---
Mahamadou Moudjahid Nouroudini Moussa

Repository Link
---
https://github.com/nyu-csci-ua-0467-001-002-fall-2024/final-project-Danjari

URL for deployed site 
---
http://linserv1.cims.nyu.edu:32291/

URL for form 1 (from previous milestone) 
---

http://linserv1.cims.nyu.edu:32291/project/create

Special Instructions for Form 1
---
To access form one you will need to be registered. 
ideally as an Admin ( so you have access to everything)
I will add a user at the end of the document so you can see exactely what everything looks like. 

URL for form 2 (for current milestone)
---
http://linserv1.cims.nyu.edu:32291/task/create/6753cf57652fe2f50e45e0d1

Special Instructions for Form 2
---
same thing, user needs to be authenticated. 

URL for form 3 (from previous milestone) 
---
Login paging. 

Special Instructions for Form 3
---
http://linserv1.cims.nyu.edu:32291/register

or the invitation form from admin 
http://linserv1.cims.nyu.edu:32291/teams 
( admin access only )

First link to github line number(s) for constructor, HOF, etc.
---
https://github.com/nyu-csci-ua-0467-001-002-fall-2024/final-project-Danjari/blob/master/app.mjs

HOF : line 27    // created  middleware ( isAdmin  ), this function check if the user is admin and give them permission accordingly,     
HOF : line 34, // middleware function ( authenticate ) this function authenticate users to make sure they have access to the right teams and proper projects. 
HOF .map : line 81 // maps that return a list of members (id, email, username) so we can assign task 
HOF .filter : 295  // filter tasks 


Link to github line number(s) for schemas (db.js or models folder)
---
https://github.com/nyu-csci-ua-0467-001-002-fall-2024/final-project-Danjari/blob/master/db.mjs

Description of research topics above with points
---
(TODO: add description of research topics here, including point values for each, one per line... for example: 2 points - applied and modified "Clean Blog" Bootstrap theme)
Research topics : 

* (3 points) Integrate user authentication 
    * Using email for user authentication
    * Added JWT and Cookie parsing to remember user 
* (4 points) Email Integration
    * Using Nodemailer for sending project sharing emails
    * Using Nodemailer to invite team members to join the team. 
* (3 points) Mocha Unit Testing
    * testing user login because it's the most important, and permissions based on team member or admin

Links to github line number(s) for research topics described above (one link per line)
---
user authentication using JWT and cookie parsing : 

Email Integration : 

Mocha: 

Optional project notes 
---

for quick testing all the specs of the project you can sign in with this : 
email:  mm12515@nyu.edu
password : 1234567890

any other email would work in you register. Feel free to test the invitation to the team form as well ( in the team tab )

Attributions
---
Understood JWT auth based using this [link:  ](https://medium.com/@maison.moa/using-jwt-json-web-tokens-to-authorize-users-and-protect-api-routes-3e04a1453c3e)

Nodemailer:  
JWT: 
Mocha: used this [ link ](https://www.browserstack.com/guide/unit-testing-for-nodejs-using-mocha-and-chai) and [this](https://www.youtube.com/watch?v=xDI2KK2gSgQ) Youtube video to understand it 
Mongo DB: using [this](https://www.mongodb.com/docs/atlas/tutorial/deploy-free-tier-cluster/) documentation and lecture notes
Use of AI: used Chat GPT for code debugging (Mocha testing, HBS syntax and adding js functions in dashboard) and commenting some of the code. 