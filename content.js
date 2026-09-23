/*
  L SQUARED HOMEPAGE: WORDS, PHOTOS AND LAYOUT
  ============================================
  This is the only file you need to edit.

  HOW EACH LINE WORKS
  - Every line is:   label: what shows on the page
  - Change only what is AFTER the first colon. Never change the label.
  - A | makes a new line in titles, for example:   We own it.|You run it.
  - Lines starting with # are notes. Lines starting with == are headings.
  - Never type the ` character (the backtick). Everything else is fine.
  - Leave a line empty after the colon to keep what the page has now.

  PHOTOS
  - Upload the photo into the "assets" folder on GitHub first,
    then write its file name here, for example:   ind-retail-new.webp
  - Phone photos live in "assets/m", so write:   m/ind-retail-new.webp
  - Give a changed photo a NEW file name instead of replacing the old file,
    so nobody sees the old one from their browser's memory.
  - Industry photos can be any shape; the page measures them itself.

  OPTIONAL LINES AND BACKGROUNDS
  - Each section has a "line under title" and a "line at end". Leave them
    empty and nothing shows; write something and it appears.
  - A "background" or "text colour" takes any colour, for example  #FFFFFF  or  white.
    Leave it empty to keep the design. Text colour only changes words on the
    background, never words on top of photos or screens.

  LAYOUT
  - 100% is the size it is now. 120% is bigger, 80% is smaller.
  - Laptop and phone are set separately.

  If something looks wrong after an edit, check the line you changed,
  or put it back. A broken line never blanks the site; the page just
  keeps its original words.
*/
window.LSQ_CONTENT = `

== PAGE ==
page title: L Squared
page description: L Squared digital signage platform and managed network.

== MENU (top bar and footer) ==
menu 1: Industries
menu 2: Publishing
menu 3: Support
menu 4: Clients
top button: Book a demo

== HERO ==
hero title: One platform.

== BLUE STATEMENT ==
statement line at end:
statement background:
statement text colour:
statement: We own the platform.|You own the network.

== WHY LSQUARED ==
why line under title:
why line at end:
why background:
why text colour:
why title: Who We Are.
why 1 word: People
why 1 line: A business built on lasting relationships.
why 1 photo: team.webp
why 2 word: Trust
why 2 line: 20+ years of expertise. | You can depend on.
why 2 photo: Trust.png
why 3 word: Security
why 3 line: SOC 2 Type II. ISO 27001.|Enterprise-grade security built in.
why 3 photo: security.webp
why 4 word: Support
why 4 line: Less escalation. More resolution.
why 4 photo: support.webp
why 5 word: Scale
why 5 line: We grow alongside you. | Keeping up from start to finish. 
why 5 photo: scale.webp

== INDUSTRIES ==
industries line under title:
industries line at end:
industries background:
industries text colour:
# Add an industry 5 (name, photo, phone photo) to add one; delete all three lines of one to remove it.
industries title: Different industries. One standard.
industries link: Explore all industries
# the photos move on by themselves (laptop and phone); how many seconds each one shows
industries seconds per photo: 2
industry 1 name: Restaurants
industry 1 photo: ind-restaurants.webp
industry 1 phone photo: m/ind-restaurants.webp
industry 2 name: Retail
industry 2 photo: ind-retail.webp
industry 2 phone photo: m/ind-retail.webp
industry 3 name: Enterprise 
industry 3 photo: Enterprise.png
industry 3 phone photo: m/ind-hospitality.webp
industry 4 name: Manufacturing
industry 4 photo: mfg-on.webp
industry 4 phone photo: m/mfg-on.webp

== CEO QUOTE ==
ceo quote line at end:
ceo quote background:
ceo quote text colour:
ceo quote: Twenty years leading teams in software, IT and engineering. Growing businesses is what drives me. The goal is a company that is truly built to last.
ceo name: Gaj Ratnavel, CEO

== PUBLISHING ==
publishing line at end:
publishing background:
publishing text colour:
publishing title: Published in one click.
publishing line under title: It's that easy.
publishing option 1: Breakfast
publishing option 2: Lunch
publishing button: Publish
publishing status before: Nothing published
# the status reads the option name plus these words, for example "Breakfast ready", "Breakfast live"
publishing ready word: ready
publishing live word: live
publishing screen 1 empty photo: menu-blank.webp
publishing screen 1 option 1 photo: menu-breakfast.webp
publishing screen 1 option 2 photo: menu-lunch.webp
publishing screen 2 empty photo: drivethru-blank.webp
publishing screen 2 option 1 photo: drivethru.webp
publishing screen 2 option 2 photo: drivethru-menu.webp

== DEAD SCREEN ==
dead screen line at end:
dead screen background:
dead screen text colour:
dead screen title: Everyone notices a dark screen.
dead screen line under title: We keep yours on.
# the off and on photos must be the same scene at the same size, or the slider will not line up
dead screen off photo: retail-off.webp
dead screen on photo: retail-on.webp
dead screen off phone photo: m/retail-off.webp
dead screen on phone photo: m/retail-on.webp

== TRUSTED BY ==
trusted by line under title:
trusted by line at end:
trusted by background:
trusted by text colour:
trusted title: Trusted by
testimonial: Our office and most warehouses are transformed with the new digital displays. It allows us to circulate important business updates and critical information quickly across these facilities. The locations with this technology have quickly realized greater engagement from the employees.
testimonial logo: logos/purolator.png
# Logos: upload the file into assets/logos, then add a name and a file line. Add logo 10, 11 and so on for more.
# A logo with its own colours on a clear or white background works best.
logo 1 name: The UPS Store
logo 1 file: logos/ups-store-hq.png
logo 2 name: Cold Stone Creamery
logo 2 file: logos/cold-stone-creamery-hq.png
logo 3 name: Hatch
logo 3 file: logos/hatch-hq.png
logo 4 name: McMaster University
logo 4 file: logos/mcmaster-university-hq.png
logo 5 name: International Centre
logo 5 file: logos/international-centre-hq.png
logo 6 name: Cisco
logo 6 file: logos/cisco-hq.png
logo 7 name: Best Buy Business
logo 7 file: logos/best-buy-business-hq.png
logo 8 name: Lenovo
logo 8 file: logos/lenovo-hq.png
logo 9 name: SFM
logo 9 file: logos/sfm-hq.png

== FIGURES (big words | small words) ==
figures line at end:
figures background:
figures text colour:
figure 1: One team.| Start to finish.
figure 2: Independently Owned. 
figure 3: Every feature included.| No hidden fees.
figure 4: 50,000+|screens managed.
figure 5: Expert support.| 24/7.
figure 6: Your screens.| Our responsibility.
figure 7: Building relationships|since 2006.
figure 8: 20 minute|response time.
figure 9: Remote Publishing. 

== CONTACT ==
contact line under title:
contact line at end:
contact background:
contact text colour:
contact title: We're here to help.
contact email label: Work email
contact email example: you@company.com
contact screens label: Number of screens
contact screens choices: 1 to 10, 10 to 50, 50 to 250, 250 or more
contact button: Book a demo
contact error message: Enter a work email address.
contact sent message: Request sent.
# the form sits on the screens in this photo, so a new photo needs its screens in the same places
contact photo: demo-wall.webp
contact phone photo: m/demo-wall.webp

== SECTION ORDER ==
# Write the sections in the order you want them. The hero always comes first.
# Names: statement, why, industries, ceo quote, publishing, dead screen, trusted by, figures, contact
section order: statement, why, industries, ceo quote, publishing, dead screen, trusted by, figures, contact

== FOOTER ==
footer background:

== LAYOUT: LAPTOP (100% = as it is now) ==
laptop title size: 100%
laptop space under titles: 100%
laptop space above and below sections: 100%
laptop statement size: 100%
laptop ceo quote size: 100%
laptop why lsquared height: 100%
laptop industries photo size: 100%
laptop publishing photos size: 100%
laptop dead screen photo size: 100%

== LAYOUT: PHONE (100% = as it is now) ==
phone title size: 100%
phone space under titles: 100%
phone space above and below sections: 100%
phone statement size: 100%
phone ceo quote size: 100%
phone why lsquared height: 100%
phone industries photo size: 100%
phone publishing photos size: 100%
phone dead screen photo size: 100%

== SHOW OR HIDE SECTIONS (yes or no) ==
show statement: yes
show why lsquared: yes
show industries: yes
show ceo quote: yes
show publishing: yes
show dead screen: yes
show trusted by: yes
show figures: yes
show contact: yes

`;
