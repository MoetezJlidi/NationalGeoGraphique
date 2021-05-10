Un site sensibilisant les utilisateurs à l'importance de l'écologie, de faire attention à nos déchets et aux produits que nous utilisons.
Rendre le monde meilleur en l'épurant des choses néfastes que nous produisons.
Tout cela en mettant en place un compteur des déchets jetés par l'humanité depuis une certaine date.
Ainsi qu'une estimation des déchets produits et/ou jetés par l'utilisateur depuis sa naissance en fonction de sa consommation et de ses habitudes (tri sélectif, compost).

Description donnée aux profs :
Le site que nous avons choisi de développer est un site ayant pour but de sensibiliser les utilisateurs à l'écologie et ses bienfaits.
Il sera composé de plusieurs pages :
Une page index montrant une estimation de la quantité de déchets produite par l'humanité depuis le début de l'année 2021
Une page nécessitant de se connecter afin d'avoir accès à des mini-jeux (Un jeu où l'on doit deviner dans quelle poubelle jeter un déchet donné et un quizz. Peut-être plus si nous avons encore du temps et d'autres idées)
Chaque utilisateur connecté aura un score en fonction de son résultat aux minis jeux.
Un utilisateur connecté aura la possibilité de rentrer sa date de naissance sur une autre page afin d'avoir une estimation des déchets qu'il a produit depuis sa naissance.
Ainsi qu'une estimation des déchets qu'il aurait pu éviter ou qu'il a évité en recyclant.
Nous aurons donc une table sql "users" contenant le nom d'utilisateur, son mot de passe et ses informations(role, score, date de naissance).
Une table "garbage" pour le premier jeu qui contiendra différents déchêts, images ou nom d'image associée et le type poubelle dans lequel il doit être jeté.

Et une table pour les questions du quizz "quizzQuestions"
Certaines fonctionnalités peuvent être amenées à changer si nous avons de meilleures idées ou des diffiultés.

PS : N'oubliez pas d'entrer "npm install" en cmd pour installer les modules nécessaires au serveur. 