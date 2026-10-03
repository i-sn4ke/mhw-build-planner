# Monster Hunter: World + Iceborne Build Planner

Un planner per creare, verificare e condividere build di **Monster Hunter: World e Iceborne**, con dati reali importati localmente e un'interfaccia ispirata ai menu di gioco.

Il progetto è una SPA in React e TypeScript, costruita con Vite, Tailwind CSS e Zustand. Il calcolo e la generazione delle build avvengono nel browser, senza un backend.

## Funzionalità

- Builder manuale con arma, cinque pezzi di armatura, amuleto e gioielli negli slot disponibili.
- Selettori con ricerca e filtri; ricerca dei gioielli anche per nome delle skill conferite.
- Visualizzazione di statistiche, elementi e stati dell'arma, difesa e resistenze.
- Aggregazione delle skill, tooltip descrittivi, Set Bonuses, Secret skill caps e Inheritance.
- Simulazione locale dei bonus ad attacco e affinity delle skill supportate, con condizioni attivabili manualmente.
- Generazione di fino a tre build che soddisfano i livelli minimi delle skill richieste, mantenendo l'arma scelta.
- Condivisione delle build attraverso URL con query parameter `?b=<payload>`.
- Layout responsive, icone di categoria colorate per rarità e font IM Fell English SC e Cinzel serviti localmente.

## Avvio locale

Usare **Node.js 24** e npm. Dalla directory del progetto:

```sh
npm ci
npm run dev
```

Aprire l'indirizzo indicato da Vite nel terminale. In sviluppo l'app è servita dal percorso `/`.

| Comando | Scopo |
| --- | --- |
| `npm run dev` | Server di sviluppo con aggiornamento automatico |
| `npm run build` | Controllo TypeScript e build di produzione in `dist/` |
| `npm run preview` | Anteprima locale della build di produzione |
| `npm run lint` | Controlli ESLint |
| `npm test` | Test dei calcoli, delle skill e del generatore |

Per l'anteprima eseguire prima `npm run build`, poi `npm run preview` e aprire il percorso `/mhw-build-planner/` sull'indirizzo indicato nel terminale.

## Generatore e simulazione

Il generatore richiede un'arma selezionata, un rank e almeno una skill con il suo livello minimo. Il rank limita **solo le armature**; amuleti e gioielli vengono cercati nell'intero catalogo, assumendo copie illimitate dei gioielli. La ricerca avviene in un Web Worker, con limiti di tempo e di nodi esplorati. Se raggiunge un limite senza trovare build, non prova che la combinazione sia impossibile. I risultati soddisfano le skill richieste, senza una classifica per danno.

La simulazione offensiva applica le skill attualmente supportate: Attack Boost, Critical Eye, Agitator, Weakness Exploit, Peak Performance, Resentment, Maximum Might, Latent Power e Critical Draw. Le condizioni manuali modificano la simulazione locale. Non è un calcolatore completo del danno: sharpness, moltiplicatori dei critici e formule di danno non sono simulati.

I link condivisi contengono la configurazione dell'equipaggiamento. Le condizioni manuali della simulazione non fanno parte del payload. Il formato di sharing mantiene il percorso corrente dell'app e funziona anche sotto il percorso di GitHub Pages.

## Struttura

```text
src/
  components/       Builder, selettori e pannelli dell'interfaccia
  engine/           Calcoli, generazione, simulazione e sharing
  store/            Stato della build gestito con Zustand
  types/            Tipi del dominio
  data/             Accesso ai cataloghi
    generated/      JSON reali prodotti dagli importer
  workers/          Generazione delle build fuori dal thread principale
  assets/           Font, icone e risorse grafiche
scripts/import-mhw-data/  Importer dei dati locali
tests/                   Test eseguiti con Node.js
design/                  Campionario statico degli asset dell'interfaccia
.github/workflows/       Deploy automatico su GitHub Pages
```

## Dati

I cataloghi di armi, armature, amuleti, gioielli, skill e Set Bonuses sono già presenti in `src/data/generated/`. Non occorrono chiamate a un'API per usarli e non è necessario eseguire gli importer per avviare o pubblicare l'app.

**Non modificare manualmente i JSON generati e non sostituirli con mock.** Gli script in `scripts/import-mhw-data/` leggono il progetto sorgente locale `../MHWorldData/source_data/` e scrivono i cataloghi. La rigenerazione richiede quella sorgente ed è un'operazione separata dal normale sviluppo; l'import delle armi dipende anche dai cataloghi skill e Set Bonuses già generati.

## Asset e attribuzioni

Monster Hunter è una proprietà di Capcom; questo è un progetto non ufficiale. Le origini delle risorse grafiche sono documentate in [src/assets/hunter/README.md](src/assets/hunter/README.md). Le icone provenienti da MHWorldData includono la relativa licenza MIT. Le licenze dei font sono incluse in [src/assets/fonts/](src/assets/fonts/).
