# Assignment 1 reflection

**Breakthrough that moved the work forward:** The moment that actually
changed how I worked wasn't a bug fix, it was realising that finding a bug
once doesn't mean it's handled. When I put annotation markers on the bird
photos, I eyeballed all 12 and caught 3 where the photo didn't even show the
feature it claimed to. My first instinct was just to swap those 3 photos and
move on — job done. But that "3 out of 12" number bugged me, because it meant
the same mistake could easily happen again the next time a photo or
coordinate changed, and nothing would catch it. So instead of patching and
moving on, I built an actual check for it: a test for the mechanical stuff
(coordinates in range, files exist) plus a script that composites the markers
onto the real photos so I can eyeball them fast, and a CLAUDE.md rule saying
"run this before you commit a photo change." I even talked myself out of
wiring an AI vision check into CI, because a wrong-but-confident check is
worse than no check. That felt like the real shift: from "did I fix it" to
"will this stay fixed."

**What this changed about who I want to be as a developer:** I want to be
someone who turns a caught mistake into something that can't quietly happen
again, not just someone who's good at fixing things when they're pointed out.
Retrying until something looks right is easy and feels productive, but it
doesn't protect future-me. Writing the check, the rule, or the test is the
slower move, but it's the one that actually compounds.
