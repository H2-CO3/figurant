// The atelier's words, in English and in French. What is written into a fiche
// for the LLM (the labels of an order: "Character:", "Props to use:") stays in
// English whatever the language: it is a format, not a sentence.

const WORDS = {
    en: {
        'tab.scenes': 'Animation room', 'tab.characters': 'Characters', 'tab.props': 'Props',
        character: 'Character', 'width.label': 'Screen width', 'speed.label': 'Playback speed',
        pause: '⏸', play: '▶', 'pause.title': 'Play or pause', step: '⏭ Next frame', 'step.title': 'Pause and advance by one frame, to look at a movement closely', 'speed.full': 'Normal', replay: '↺', 'replay.title': 'Play again from the start',
        played: 'played {n}×',
        marks: 'Show attachment points',
        status: 'Status', 'status.draft': 'draft', 'status.checked': 'checked by the machine', 'status.approved': 'approved by eye',
        'tag.draft': 'draft', 'tag.checked': 'checked', 'tag.approved': 'approved', 'tag.todo': 'to create', 'tag.gesture': 'common gesture', 'tag.asked': 'sent',
        'elements.title': 'Use what exists',
        note: 'Your directions', 'note.placeholder': 'Say what to change.',
        'redo': 'Send', 'approve': 'Good ✓',
        you: 'You', llm: 'Assistant',
        'decision.redo': 'to redo', 'decision.note': 'note', 'decision.approve': 'approved', 'decision.brief': 'order',
        'saved.approved': 'Approved.',
        'saved.written': 'Sent.',
        'saved.ordered': 'Ordered.',
        'reloaded': 'Updated.',
        'saved.failed': 'Not saved: {error}', 'order.failed': 'Not ordered: {error}',
        
        'new': 'New', 'fresh.title': 'Something new', 'new.title': 'New {noun}',
        'noun.scenes': 'animation', 'noun.characters': 'character', 'noun.props': 'prop',
        'new.name': 'Name', 'new.name.placeholder': 'Any name you like', 'name.bad': 'Give it a name with at least one letter or digit.',
        'new.props': 'Props to use', 'new.on': 'Starts when',
        'on.attention': 'the visitor hovers the element (or centres it on a phone)', 'on.idle': 'the visitor leaves the character alone',
        'on.view': 'the character arrives', 'on.click': 'the visitor clicks',
        'new.mood': 'Tone', 'mood.free': 'free', 'mood.solemn': 'solemn (no gag)',
        'new.text': 'What do you want?', 'new.text.placeholder': 'Say it.',
        order: 'Order it', cancel: 'Cancel',
        'exists.already': 'There is already a {noun} named “{name}”.',
        'empty.scenes': 'Nothing yet. Order one: “+ New”.',
        'empty.characters': 'Nothing yet. Order one: “+ New”.',
        'empty.props': 'Nothing yet. Order one: “+ New”.',
        'ordered.made': 'Made. Reload.',
        'ordered.waiting': 'Ordered. Not made yet.',
        'config.failed': 'Could not load /figurant.config.js: {error}\nThe atelier needs a figurant.config.js at the project root, exporting { cast, scenes, props }.',
        'move.blink': 'blink', 'move.glance': 'glance', 'move.hop': 'hop', 'move.walk': 'walk', 'move.wave': 'wave', 'move.sit': 'sit', 'move.look-left': 'looks left', 'move.look-right': 'looks right', 'move.look-front': 'looks ahead', 'move.turn': 'turns', 'move.surprise': 'surprise',
        'custom.title': 'Head',
        'custom.face': 'Face', 'custom.blink': 'Blinking', 'custom.wide': 'Surprised', 'custom.squint': 'Doubting',
        'custom.apply': 'Apply', 'custom.image': 'Picture', 'custom.remove': 'Remove the picture',
        'custom.saved': 'Saved.', 'custom.failed': 'Not saved: {error}', 'custom.using': 'Picture in use: {name}',
        'tab.emoji': 'Emoji & pictures',
        'about.label': 'What this is about', 'about.this': '🎬 Change “{name}”', 'about.interface': '🛠 Change the interface', 'about.interface.title': 'A remark about this page itself, not about what is on show', 'interface.placeholder': 'Say what to change in this page.', 'saved.interface': 'Noted, about the interface.', 'about.new': '✚ Something new', more: '⚙ Advanced', 'tab.board': 'Drawing', 'board.hint': 'Draw here.', 'board.note': 'Say what it is.', 'board.say': '✏️ Draw, then tell me what it is: I will make a character of it.', 'board.legs': '🦵 Give it legs', 'board.undo': '↶ Undo', 'board.clear': '🗑 Start again', 'board.eraser': '🧽 Eraser', 'board.colour': 'Colour', 'board.size': 'Pen', 'board.empty': 'Draw something first.', 'board.failed': 'Not saved: {error}', 'board.walking': 'Your drawing has legs.', export: 'Export', 'export.title': 'Export: a GIF, and a folder ready for a website', 'export.doing': 'Exporting…', 'export.film': 'Filming… {n} %', 'export.done': 'Exported: {folder}/', 'export.failed': 'Not exported: {error}', 'more.title': 'Settings', 'scrub.label': 'Timeline', resume: '▶ Go on', restart: '↺ From the start', moment: 'At {s} s', detailed: 'Detailed order…', 'fresh.scenes': 'Say what it should do.', 'fresh.example': 'For example: can you make it do a cartwheel?', 'demo.made': 'An example, asked for like this: “{prompt}”', 'demo.duel-dance': 'an epic duel between two stick figures with swords of light, one blue, one red, who somersault, throw each other about from afar and hurl furniture, then end up tap dancing together', 'demo.tap-dance-stickman': 'can you make it tap dance?', 'demo.notes': 'it sits beside a couch and takes notes', 'demo.hello': 'make it say hello', 'tab.effects': 'Effects', 'kind.effects': 'Effect', 'noun.effects': 'New effect', 'fresh.effects': 'Say which effect you want.', 'empty.effects': 'Nothing yet. Order: “+ New”.', 'item.burst': 'Burst', 'item.dust': 'Dust', 'item.shockwave': 'Shockwave', 'item.flash': 'Flash', 'item.bolt': 'Lightning', 'item.wave': 'Wave', 'item.clash': 'Clash', 'item.landing': 'Landing', 'home.title': 'Back to the start: ask for something new', 'style.open.title': 'Styles: change the look, or make your own', 'style.word': 'Style', 'style.none': 'none', tutor: '?', 'tutor.title': 'Show or hide the explanations',
        'tip.home': 'Back to the start, ready to ask for something new.', 'tip.tabs': 'The workshops: animations, characters, emoji figures, props, special effects, scenes of several characters, and a sheet to draw on.', 'tip.list': 'What exists already. Click one to watch it play.', 'tip.stage': 'The stage: what you look at plays here. Space pauses it.', 'tip.write': 'Write what you want here, in your own words. Your assistant makes it, and answers here.', 'tip.about': 'What your message is about: what is on show, this page itself, or something new.', 'tip.style': 'Styles: each has its colours and its own characters. Click to change, or to make yours.', 'tip.settings': 'Settings: slow motion, frame by frame, screen width, and the earlier versions.', 'tip.export': 'Export: a GIF, and a folder ready for a website.', 'tip.listening': 'Green: an assistant reads what you write. Grey: nobody is listening yet.', 'tip.language': 'The language of this page.',
        'demo.tug-of-war': 'two stick figures pull on a rope; one ends up pulled over and the other jumps for joy', 'demo.copycat': 'one stick figure copies everything the other does, half a second late', 'demo.for-and-against': 'two stick figures picket with opposite signs, swap, and end up not knowing', 'demo.well-met': 'two stick figures walk up to each other, shake hands and jump for joy',
        'item.tug-of-war': 'A tug of war', 'item.copycat': 'The copycat', 'item.for-and-against': 'For and against', 'item.well-met': 'Well met', 'item.haul': 'Hauling', 'item.hello': 'Hello', 'item.notes': 'Taking notes', 'item.tap-dance-stickman': 'Tap dance', 'item.fence-stickman': 'Sword of light', 'item.duel-stickman': 'Duel', 'item.neon-ride-stickman': 'Neon ride', 'item.neon-ride': 'The ride without end', 'fresh.says': 'Simon says: do a cartwheel', 'item.navigate-stickman': 'Navigating', 'item.picket': 'Picket', 'item.shake-hands': 'Shaking hands', 'item.cheer': 'Cheer', 'item.faces-emoji': 'Faces', 'item.walk-the-dog': 'Walking the dog', 'item.duel-dance': 'A duel, then a dance', 'item.stickman': 'Stickman', 'item.figure': 'Figure', 'fresh.characters': 'Say who you want.', 'fresh.emoji': 'Say which figure you want.', 'fresh.props': 'Say which object you want.', 'fresh.compositions': 'Tell the story.', 'step.choose': 'Pick', 'step.watch': 'Watch', 'step.say': 'Say',
        'width.phone': 'Phone', 'width.tablet': 'Tablet', 'width.desktop': 'Desktop', 'sliders.title': 'Fine settings',
        'questions.title': 'Answer',
        'redo.title': 'Send your directions: your assistant will change it', 'approve.title': 'You watched it and it is right',
        'listening.on': 'Listening', 'listening.off': 'Nobody',
        'listening.on.title': 'What you write here is read as soon as you send it.',
        'listening.off.title': 'What you write is saved, but nobody is waiting for it. Ask your assistant to run: figurant fiches --wait',
        'style.open': '🎨 Style', 'style.title': 'Styles',
        'style.placeholder': 'What everything must look like, in your words.',
        'style.save': 'Save', 'style.saved': 'Style saved.',
        'noun.emoji': 'emoji figure', 'empty.emoji': 'No emoji figure in this project.',
        yes: 'Yes', no: 'No', history: 'History', 'pin': 'Point', 'pin.on': 'Click the spot.', 'pin.clear': 'Remove the pins',
        'new.drawing': 'Start from a drawing (optional)',
        'listening.working': 'Working', 'working.on': 'Working…', 'working.nobody': 'Sent. Nobody is listening.',
        'style.name': 'Name', 'style.prompt': 'Description, for whoever draws', 'style.paper': 'Background', 'style.ink': 'Text', 'style.accent': 'Accent', 'style.pop': 'Bright',
        'style.new': '+ New style', 'style.delete': 'Delete', 'style.delete.sure': 'Delete for good?', 'style.deleted': 'Style deleted.', 'style.close': 'Close', 'style.hint': 'Click a style to work in it.', 'style.edit': '✎ Edit', 'style.edit.title': 'Edit the style', 'style.new.title': 'New style', 'style.back': 'Cancel', 'style.sample': 'Aa', 'style.inuse': 'This is the style in use.', 'style.used': 'in use', 'style.label': '🎨 {name}', 'style.untitled': 'New style',
        'every.on': 'All styles', 'every.off': 'This style only', before: 'Before', after: 'After', 'versions.title': 'Versions', 'version.now': 'Now', 'version.restore': '↩ Take this one back', 'version.restore.title': 'This version becomes the present one; the others are kept', 'version.failed': 'Not brought back: {error}', 'version.older': '◀ Earlier', 'version.name': 'Before · {n}/{of}',
        'kind.scenes': 'Animation', 'kind.characters': 'Character', 'kind.emoji': 'Emoji figure', 'kind.props': 'Prop', 'context.of': 'of {name}', 'context.style': 'style: {name}', 'context.nostyle': 'every style',
        'busy.title': 'Working',
        'tab.compositions': 'Scenes', 'kind.compositions': 'Scene', 'noun.compositions': 'scene', 'empty.compositions': 'Nothing yet. Order one: “+ New”.', 'new.cast': 'Who is in it',
        'clip.walk': 'walks', 'clip.exit': 'leaves', 'clip.set': 'pose', 'clip.fly': 'rises', 'clip.land': 'comes down',
        language: 'Language',
    },
    fr: {
        'tab.scenes': 'Chambre d’animation', 'tab.characters': 'Personnages', 'tab.props': 'Accessoires',
        character: 'Personnage', 'width.label': 'Largeur d’écran', 'speed.label': 'Vitesse de lecture',
        pause: '⏸', play: '▶', 'pause.title': 'Lecture ou pause', step: '⏭ Image suivante', 'step.title': 'Met en pause et avance d’une image, pour regarder un mouvement de près', 'speed.full': 'Normale', replay: '↺', 'replay.title': 'Rejouer depuis le début',
        played: 'jouée {n}×',
        marks: 'Afficher les points d’attache',
        status: 'État', 'status.draft': 'brouillon', 'status.checked': 'vérifié par la machine', 'status.approved': 'validé à l’œil',
        'tag.draft': 'brouillon', 'tag.checked': 'vérifié', 'tag.approved': 'validé', 'tag.todo': 'à créer', 'tag.gesture': 'geste commun', 'tag.asked': 'envoyé',
        'elements.title': 'Utiliser l’existant',
        note: 'Tes indications', 'note.placeholder': 'Dis ce qu’il faut changer.',
        'redo': 'Envoyer', 'approve': 'C’est bon ✓',
        you: 'Toi', llm: 'Assistant',
        'decision.redo': 'à refaire', 'decision.note': 'note', 'decision.approve': 'validé', 'decision.brief': 'commande',
        'saved.approved': 'Validé.',
        'saved.written': 'Envoyé.',
        'saved.ordered': 'Commandé.',
        'reloaded': 'Mis à jour.',
        'saved.failed': 'Non enregistré : {error}', 'order.failed': 'Non commandé : {error}',
        
        'new': 'Nouveau', 'fresh.title': 'Du nouveau', 'new.title': '{noun}',
        'noun.scenes': 'Nouvelle animation', 'noun.characters': 'Nouveau personnage', 'noun.props': 'Nouvel accessoire',
        'new.name': 'Nom', 'new.name.placeholder': 'Le nom que tu veux', 'name.bad': 'Donne un nom avec au moins une lettre ou un chiffre.',
        'new.props': 'Accessoires à utiliser', 'new.on': 'Elle démarre quand',
        'on.attention': 'le visiteur survole l’élément (ou le centre sur téléphone)', 'on.idle': 'le visiteur laisse le personnage tranquille',
        'on.view': 'le personnage arrive', 'on.click': 'le visiteur clique',
        'new.mood': 'Ton', 'mood.free': 'libre', 'mood.solemn': 'recueilli (pas de gag)',
        'new.text': 'Que veux-tu ?', 'new.text.placeholder': 'Dis-le.',
        order: 'Commander', cancel: 'Annuler',
        'exists.already': 'Ce nom est déjà pris : « {name} ».',
        'empty.scenes': 'Rien encore. Commande : « + Nouveau ».',
        'empty.characters': 'Rien encore. Commande : « + Nouveau ».',
        'empty.props': 'Rien encore. Commande : « + Nouveau ».',
        'ordered.made': 'C’est fait. Recharge.',
        'ordered.waiting': 'Commandé. Pas encore fait.',
        'config.failed': 'Impossible de charger /figurant.config.js : {error}\nL’atelier a besoin d’un figurant.config.js à la racine du projet, qui exporte { cast, scenes, props }.',
        'move.blink': 'cligner', 'move.glance': 'regarder', 'move.hop': 'sauter', 'move.walk': 'marcher', 'move.wave': 'saluer', 'move.sit': 's’asseoir', 'move.look-left': 'regarde à gauche', 'move.look-right': 'regarde à droite', 'move.look-front': 'regarde devant', 'move.turn': 'se retourne', 'move.surprise': 'surprise',
        'custom.title': 'Tête',
        'custom.face': 'Visage', 'custom.blink': 'Clignement', 'custom.wide': 'Surprise', 'custom.squint': 'Doute',
        'custom.apply': 'Appliquer', 'custom.image': 'Image', 'custom.remove': 'Retirer l’image',
        'custom.saved': 'Enregistré.', 'custom.failed': 'Non enregistré : {error}', 'custom.using': 'Image utilisée : {name}',
        'tab.emoji': 'Emoji et images',
        'about.label': 'De quoi on parle', 'about.this': '🎬 Changer « {name} »', 'about.interface': '🛠 Changer l’interface', 'about.interface.title': 'Une remarque sur cette page elle-même, pas sur ce qui est montré', 'interface.placeholder': 'Dis ce qu’il faut changer dans cette page.', 'saved.interface': 'Noté, pour l’interface.', 'about.new': '✚ Du nouveau', more: '⚙ Avancé', 'tab.board': 'Dessin', 'board.hint': 'Dessine ici.', 'board.note': 'Dis ce que c’est.', 'board.say': '✏️ Dessine, puis dis-moi ce que c’est : j’en fais un personnage.', 'board.legs': '🦵 Donne-lui des jambes', 'board.undo': '↶ Annuler', 'board.clear': '🗑 Recommencer', 'board.eraser': '🧽 Gomme', 'board.colour': 'Couleur', 'board.size': 'Crayon', 'board.empty': 'Dessine d’abord quelque chose.', 'board.failed': 'Non enregistré : {error}', 'board.walking': 'Ton dessin a des jambes.', export: 'Export', 'export.title': 'Exporter : un GIF, et un dossier prêt pour un site web', 'export.doing': 'Export…', 'export.film': 'Tournage… {n} %', 'export.done': 'Exporté : {folder}/', 'export.failed': 'Non exporté : {error}', 'more.title': 'Réglages', 'scrub.label': 'Ligne de temps', resume: '▶ Reprendre', restart: '↺ Du début', moment: 'À {s} s', detailed: 'Commande détaillée…', 'fresh.scenes': 'Dis ce qu’il doit faire.', 'fresh.example': 'Par exemple : tu peux lui faire faire la roue ?', 'demo.made': 'Un exemple, demandé ainsi : « {prompt} »', 'demo.duel-dance': 'un duel épique entre deux stickmen au sabre laser, un bleu et un rouge, qui font des sauts périlleux, se projettent à distance et se lancent des meubles, puis finissent par danser des claquettes ensemble', 'demo.tap-dance-stickman': 'tu peux lui faire danser des claquettes ?', 'demo.notes': 'il est assis à côté d’un canapé et prend des notes', 'demo.hello': 'fais-lui dire bonjour', 'tab.effects': 'Effets', 'kind.effects': 'Effet', 'noun.effects': 'Nouvel effet', 'fresh.effects': 'Dis quel effet tu veux.', 'empty.effects': 'Rien encore. Commande : « + Nouveau ».', 'item.burst': 'Éclats', 'item.dust': 'Poussière', 'item.shockwave': 'Onde de choc', 'item.flash': 'Flash', 'item.bolt': 'Éclair', 'item.wave': 'Ondes', 'item.clash': 'Choc de lames', 'item.landing': 'Atterrissage', 'home.title': 'Retour au début : demander du nouveau', 'style.open.title': 'Les thèmes : changer d’allure, ou créer le tien', 'style.word': 'Thème', 'style.none': 'aucun', tutor: '?', 'tutor.title': 'Afficher ou cacher les explications',
        'tip.home': 'Retour au début, prêt à demander du nouveau.', 'tip.tabs': 'Les ateliers : animations, personnages, bonshommes à emoji, accessoires, effets spéciaux, scènes à plusieurs, et une feuille pour dessiner.', 'tip.list': 'Ce qui existe déjà. Clique pour le voir jouer.', 'tip.stage': 'La scène : ce que tu regardes joue ici. Espace met en pause.', 'tip.write': 'Écris ici ce que tu veux, avec tes mots. Ton assistant le fait, et te répond ici.', 'tip.about': 'De quoi parle ton message : ce qui est montré, cette page elle-même, ou du nouveau.', 'tip.style': 'Les thèmes : chacun a ses couleurs et ses personnages. Clique pour en changer, ou pour créer le tien.', 'tip.settings': 'Réglages : ralenti, image par image, largeur d’écran, et les versions précédentes.', 'tip.export': 'Export : un GIF, et un dossier prêt pour un site web.', 'tip.listening': 'Vert : un assistant lit ce que tu écris. Gris : personne n’écoute encore.', 'tip.language': 'La langue de cette page.',
        'demo.tug-of-war': 'deux stickmen tirent sur une corde ; l’un finit par terre et l’autre saute de joie', 'demo.copycat': 'un stickman imite tout ce que fait l’autre, avec une demi-seconde de retard', 'demo.for-and-against': 'deux stickmen manifestent avec des pancartes opposées, les échangent, et finissent par ne plus savoir', 'demo.well-met': 'deux stickmen marchent l’un vers l’autre, se serrent la main et sautent de joie',
        'item.tug-of-war': 'Le tir à la corde', 'item.copycat': 'L’imitateur', 'item.for-and-against': 'Pour et contre', 'item.well-met': 'La rencontre', 'item.haul': 'Tirer', 'item.hello': 'Bonjour', 'item.notes': 'Prise de notes', 'item.tap-dance-stickman': 'Claquettes', 'item.fence-stickman': 'Sabre laser', 'item.duel-stickman': 'Duel', 'item.neon-ride-stickman': 'Course au néon', 'item.neon-ride': 'La course sans fin', 'fresh.says': 'Jacques a dit : fais la roue', 'item.navigate-stickman': 'Navigation', 'item.picket': 'Pancarte', 'item.shake-hands': 'Poignée de main', 'item.cheer': 'Acclamation', 'item.faces-emoji': 'Visages', 'item.walk-the-dog': 'La promenade du chien', 'item.duel-dance': 'Un duel, puis une danse', 'item.stickman': 'Stickman', 'item.figure': 'Figure', 'fresh.characters': 'Dis qui tu veux.', 'fresh.emoji': 'Dis quelle figure tu veux.', 'fresh.props': 'Dis quel objet tu veux.', 'fresh.compositions': 'Raconte l’histoire.', 'step.choose': 'Choisis', 'step.watch': 'Regarde', 'step.say': 'Dis',
        'width.phone': 'Téléphone', 'width.tablet': 'Tablette', 'width.desktop': 'Ordinateur', 'sliders.title': 'Réglages fins',
        'questions.title': 'Réponds',
        'redo.title': 'Envoyer tes indications : ton assistant fera la modification', 'approve.title': 'Tu l’as regardé et c’est bon',
        'listening.on': 'À l’écoute', 'listening.off': 'Personne',
        'listening.on.title': 'Ce que tu écris ici est lu dès l’envoi.',
        'listening.off.title': 'Ce que tu écris est enregistré, mais personne ne l’attend. Demande à ton assistant de lancer : figurant fiches --wait',
        'style.open': '🎨 Style', 'style.title': 'Styles',
        'style.placeholder': 'À quoi tout doit ressembler, avec tes mots.',
        'style.save': 'Enregistrer', 'style.saved': 'Style enregistré.',
        'noun.emoji': 'Nouveau bonhomme à emoji', 'empty.emoji': 'Pas de bonhomme à emoji dans ce projet.',
        yes: 'Oui', no: 'Non', history: 'Historique', 'pin': 'Montrer', 'pin.on': 'Clique l’endroit.', 'pin.clear': 'Retirer les repères',
        'new.drawing': 'Partir d’un dessin (facultatif)',
        'listening.working': 'Au travail', 'working.on': 'Au travail…', 'working.nobody': 'Envoyé. Personne n’écoute.',
        'style.name': 'Nom', 'style.prompt': 'Description, pour celui qui dessine', 'style.paper': 'Fond', 'style.ink': 'Texte', 'style.accent': 'Accent', 'style.pop': 'Vive',
        'style.new': '+ Nouveau style', 'style.delete': 'Supprimer', 'style.delete.sure': 'Supprimer pour de bon ?', 'style.deleted': 'Style supprimé.', 'style.close': 'Fermer', 'style.hint': 'Clique un style pour travailler dedans.', 'style.edit': '✎ Modifier', 'style.edit.title': 'Modifier le style', 'style.new.title': 'Nouveau style', 'style.back': 'Annuler', 'style.sample': 'Aa', 'style.inuse': 'C’est le style en cours.', 'style.used': 'en cours', 'style.label': '🎨 {name}', 'style.untitled': 'Nouveau style',
        'every.on': 'Tous les styles', 'every.off': 'Ce style seulement', before: 'Avant', after: 'Après', 'versions.title': 'Versions', 'version.now': 'Maintenant', 'version.restore': '↩ Reprendre celle-ci', 'version.restore.title': 'Cette version redevient l’actuelle ; les autres sont gardées', 'version.failed': 'Non reprise : {error}', 'version.older': '◀ Plus ancien', 'version.name': 'Avant · {n}/{of}',
        'kind.scenes': 'Animation', 'kind.characters': 'Personnage', 'kind.emoji': 'Bonhomme à emoji', 'kind.props': 'Accessoire', 'context.of': 'de {name}', 'context.style': 'style : {name}', 'context.nostyle': 'tous les styles',
        'busy.title': 'Au travail',
        'tab.compositions': 'Scènes', 'kind.compositions': 'Scène', 'noun.compositions': 'Nouvelle scène', 'empty.compositions': 'Rien encore. Commande : « + Nouveau ».', 'new.cast': 'Qui joue',
        'clip.walk': 'marche', 'clip.exit': 'sort', 'clip.set': 'pose', 'clip.fly': 's’élève', 'clip.land': 'redescend',
        language: 'Langue',
    },
};

export const LANGUAGES = Object.keys(WORDS);
const stored = (() => { try { return localStorage.getItem('figurant.lang'); } catch { return null; } })();
let lang = LANGUAGES.includes(stored) ? stored : (navigator.language || 'en').toLowerCase().startsWith('fr') ? 'fr' : 'en';

export const language = () => lang;
export function setLanguage(next) {
    if (!LANGUAGES.includes(next)) return;
    lang = next;
    try { localStorage.setItem('figurant.lang', next); } catch { /* private window */ }
}

/** The words for a key, in the current language; {name} is filled from `values`. */
export function t(key, values = {}) {
    const text = WORDS[lang][key] ?? WORDS.en[key] ?? key;
    return text.replace(/\{(\w+)\}/g, (_, name) => values[name] ?? '');
}

/** Fills every element marked data-t (text), data-t-title, data-t-placeholder, data-t-label. */
export function translate(root = document) {
    document.documentElement.lang = lang;
    for (const node of root.querySelectorAll('[data-t]')) node.textContent = t(node.dataset.t);
    for (const node of root.querySelectorAll('[data-t-title]')) node.title = t(node.dataset.tTitle);
    for (const node of root.querySelectorAll('[data-t-placeholder]')) node.placeholder = t(node.dataset.tPlaceholder);
    for (const node of root.querySelectorAll('[data-t-label]')) node.setAttribute('aria-label', t(node.dataset.tLabel));
}

/** Every key each language has, for the test that keeps them in step. */
export const keys = () => Object.fromEntries(LANGUAGES.map(code => [code, Object.keys(WORDS[code]).sort()]));
