# Researcher guide — Ms Amilia

The study site is at:
**https://social-media-detox-study.vercel.app**

The password for the researcher and settings pages is the one Nehemiah gave you separately.

---

## Before participants come in (Pre-Detox week)

Go to `https://social-media-detox-study.vercel.app/settings` and log in.

Make sure Session Mode says **Pre-Detox (Session 1)**. If it doesn't, switch it and hit Save. You only need to do this once before the pre-detox wave starts — it stays set until you change it.

---

## Sending participants to the site

The URL participants use is just the homepage:
`https://social-media-detox-study.vercel.app`

They type in their participant ID (the one they made during prescreening — format like AB01012001), the site confirms their group and which session they're on, and they go. The three tests run in order: self-esteem questionnaire first, then Stroop, then Trail Making. About 20-25 minutes total.

Their data saves the moment they finish the last test. They don't press anything — it just happens. If they see the green "All done!" screen, you have their data.

---

## Switching to Post-Detox

After the detox week, go back to `/settings` and change Session Mode to **Post-Detox (Session 2)**. Save it. Then send participants the same link they used before. Their ID still works — the site tracks which sessions each ID has and won't get them mixed up.

---

## Checking who has completed

`https://social-media-detox-study.vercel.app/researcher`

Log in and you'll see a table of every submission: participant ID, group (Heavy/Moderate), which session, and whether it completed successfully. If someone's row says "No" under Completed, their data probably didn't save — see the troubleshooting section below.

The stat cards at the top show pre-complete, post-complete, and your target of 40. Useful for tracking where you are during data collection.

---

## Getting data into SPSS

Open the Google Sheet called "Social Media Detox Study."

The **Results** tab is what you want. One row per participant per session, columns named exactly the way SPSS expects them. To export: File → Download → Comma-separated values (.csv). Import that CSV into SPSS.

The **Stroop_Trials** tab has every individual Stroop trial — reaction time, condition, correct or not. You'll want this if you need to clean outliers before running your ANOVAs (standard practice is to drop trials under 200ms or over 2000ms before calculating the interference score).

The **Config** tab is just the site settings — ignore it.

---

## If something goes wrong

**"ID not found"** — the participant's ID isn't in the Prescreening tab of the Google Sheet. Check that the `participant_id` and `group` columns are filled in for them. The ID has to match exactly, including capitalization (AB01012001, not ab01012001).

**Completion screen shows an error (not the green screen)** — the data didn't save. Have the participant try again from the beginning. The site will warn them they already started a session, but it'll let them go through. Check the Results tab afterward to confirm only one good row came through for them.

**Participant says the site is down** — check `https://social-media-detox-study.vercel.app/api/config` in a browser. If it returns text (even messy-looking text), the site is up. If it's a blank page or error, message Nehemiah.

---

## Quick reference

| What | URL |
|---|---|
| Participant site | `https://social-media-detox-study.vercel.app` |
| Researcher dashboard | `https://social-media-detox-study.vercel.app/researcher` |
| Settings | `https://social-media-detox-study.vercel.app/settings` |
