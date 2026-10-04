# Monster Hunter: World + Iceborne Build Planner

Un banco di lavoro per preparare la prossima caccia: scegliere l’equipaggiamento, capire quali abilità si attivano e trovare combinazioni che rispettino le skill desiderate.

Il planner riunisce armi, armature, amuleti e gioielli di **Monster Hunter: World e Iceborne** in un’interfaccia ispirata ai bestiari e ai menu del gioco. Pergamena scura, cornici in bronzo, glifi tribali e illustrazioni di Rathalos e Zinogre accompagnano un builder pensato per confrontare le scelte senza perdere di vista la build complessiva.

**[Apri il planner](https://i-sn4ke.github.io/mhw-build-planner/)**

## La build, pezzo per pezzo

Il builder manuale permette di combinare un’arma, i cinque pezzi di armatura, un amuleto e i gioielli compatibili con gli slot disponibili. Le icone identificano gli slot e aprono i rispettivi selettori; il colore segue la rarità del pezzo. Il nome dello slot resta disponibile al passaggio del mouse e da tastiera.

I selettori consentono di cercare sia per nome dell’equipaggiamento sia per abilità conferite. Filtri dedicati aiutano a restringere il catalogo per rank, tipo di arma, rarità, elemento, stato o dimensione dello slot, secondo il pezzo cercato. I tooltip delle skill mostrano la descrizione e l’effetto al livello conferito dall’oggetto, anche prima di equipaggiarlo.

Accanto all’equipaggiamento, il planner raccoglie attacco, affinity, difesa, resistenze, elementi e stati dell’arma e utilizzo degli slot. I pannelli Skills e Set Bonuses ricostruiscono le abilità della build, comprese le soglie dei bonus di set, i limiti sbloccati dalle Secret skill e l’effetto di Inheritance.

## Dal requisito alla combinazione

Il Build Generator parte dal **rank** e dai livelli minimi delle skill richieste. Cerca fino a tre configurazioni di armature, amuleto e gioielli che soddisfano le richieste senza contributi dell’arma. Favorisce famiglie diverse nei vari slot e non completa la lista con sole varianti alfa/beta. Il confronto evidenzia pezzi cambiati, skill extra e slot liberi. Applicare una proposta mantiene l’arma già scelta; il tipo di arma nel generatore serve solo a preimpostare il filtro del selettore manuale.

È possibile partire da una build incompleta: i pezzi di armatura contrassegnati con **Keep for generated builds** restano fissati nei loro slot, mentre il generatore cerca il resto dell’equipaggiamento. Se un pezzo fissato appartiene a un rank diverso da quello richiesto, la generazione si ferma finché la selezione non viene allineata.

Il rank filtra le armature. Skill, slot e bonus set dell’arma sono esclusi dalla ricerca, così l’arma può essere cambiata senza perdere i requisiti soddisfatti dalla proposta. Amuleti e gioielli provengono dall’intero catalogo; i gioielli sono considerati disponibili in copie illimitate. Il generatore soddisfa i requisiti delle skill, senza ordinare i risultati per danno.

La ricerca avviene in un Web Worker, per mantenere reattiva l’interfaccia. Ha limiti di tempo e di combinazioni esplorate: una ricerca interrotta senza risultati non dimostra che la build sia impossibile.

## Leggere gli effetti delle skill

Le statistiche di base e la simulazione offensiva sono presentate separatamente. Le prime descrivono l’equipaggiamento senza upgrade, augment o bonus delle skill; la seconda applica gli effetti supportati ad attacco e affinity.

Le condizioni manuali permettono di osservare come cambiano i valori contro un punto debole, con una ferita, durante l’ira del mostro o in particolari condizioni di salute e stamina. Sono supportate Attack Boost, Critical Eye, Agitator, Weakness Exploit, Peak Performance, Resentment, Maximum Might, Latent Power e Critical Draw.

La simulazione aiuta a leggere i contributi delle abilità, ma non rappresenta un calcolo completo del danno: sharpness, moltiplicatori dei colpi critici e formule dei singoli attacchi non vengono simulati.

## Condividere una build

Una build può essere condivisa tramite un link generato dal pulsante **Share Build**. Il destinatario ritrova arma, armature, amuleto e gioielli nell’editor, senza account o salvataggi sul server.

La configurazione viaggia nel parametro `?b=<payload>` dell’URL. Le condizioni manuali della simulazione e i vincoli locali del generatore non fanno parte della build condivisa.

## Dati e tecnologia

L’app utilizza cataloghi reali importati localmente: armi, armature, amuleti, gioielli, skill e Set Bonuses sono già inclusi in `src/data/generated/`. Calcoli e generazione avvengono nel browser, senza backend né chiamate a un’API per consultare i cataloghi.

Il progetto è una SPA sviluppata con **React, TypeScript, Vite, Tailwind CSS e Zustand**. I componenti dell’interfaccia si trovano in `src/components/`, i calcoli e lo sharing in `src/engine/`, lo stato del builder in `src/store/` e il lavoro del generatore in `src/workers/`. Font, icone e materiali grafici sono serviti localmente.

I JSON generati non vanno modificati manualmente o sostituiti con mock. Gli importer in `scripts/import-mhw-data/` leggono la sorgente locale `../MHWorldData/source_data/`: la rigenerazione è separata dall’avvio e dalla pubblicazione dell’app.

## Sviluppo

Con Node.js 24 e npm:

```sh
npm ci
npm run dev
```

`npm run build` controlla TypeScript e produce `dist/`; `npm run lint` verifica il codice e `npm test` esegue i test dei calcoli e del generatore. Per un’anteprima della build, eseguire `npm run preview` e aprire `/mhw-build-planner/` sull’indirizzo indicato da Vite.

GitHub Actions pubblica automaticamente `dist/` su GitHub Pages dopo i push su `main`. La configurazione Vite usa `/` in sviluppo e `/mhw-build-planner/` in produzione, mantenendo compatibili i link condivisi.

## Crediti

Questo è un progetto non ufficiale dedicato a Monster Hunter, proprietà di **Capcom**.

Le origini e le licenze degli asset sono documentate in [src/assets/hunter/README.md](src/assets/hunter/README.md), con le risorse del nuovo tema descritte in [ui-v3/README.md](src/assets/hunter/ui-v3/README.md). Le icone provenienti da MHWorldData includono la relativa licenza MIT. Le licenze dei font IM Fell English SC, Cinzel e della variante Guild Carved Display si trovano in [src/assets/fonts/](src/assets/fonts/).
