# Audyt slopu: opus-v3 (stan wyjściowy = v2)

Każda pozycja: **co**, **gdzie**, **czym zastąpione**. Status: ✔ poprawione, ◐ częściowo lub świadomie zostawione.

## Typografia
1. ✔ **Manrope (BAN) jako jedyny krój.** `index.html` (Google Fonts), `styles.css --font`. Zastąpiony parą `workshop-tanker`: Tanker na nagłówki, Supreme (variable) na tekst.
2. ✔ **IBM Plex Mono (szara lista).** `--mono`, etykiety i placeholdery. Zastąpiony Azeret Mono 500 (latin + latin-ext).
3. ✔ **Fonty z CDN Google** (RODO, preconnect). Teraz self-host w `fonts/` (67,6 KB), `@font-face` z `font-display: swap`, `unicode-range` dla subsetów Azeret. Preload fontu usunięty, bo na file:// kończył się błędem CORS.
4. ✔ **Ciasny tracking na każdym nagłówku** (`-.035em` / `-.045em` przy wadze 800), typowy dla generatora. Tanker ma własny rysunek, więc `letter-spacing: 0` i `font-synthesis: none`.
5. ✔ **H1 łamał się na 3 linie z sierotą „co.”** (`.hero__title`). Teraz rozmiar `clamp(54px, 6.2vw, 92px)`, zawsze 2 linie, a na h2 `text-wrap: balance` (koniec z „AUTA.” sam w linii na telefonie).
6. ✔ **`font-feature-settings: "ss01"`** zostało po Manrope (`body`). Usunięte.
7. ✔ **Rozstrzelone mono-eyebrow nad każdym nagłówkiem** (`.eyebrow`, `.2em`, szare). Treść „01 / JAK PRACUJEMY” zostaje, bo tego wymaga brief, ale tracking spadł do `.03em`, numer jest w akcencie, nazwa w kolorze tekstu. Całość wygląda jak indeks arkusza rysunkowego, a nie jak badge.
8. ✔ **Hero: mono-eyebrow „DOBRA DIAGNOZA. SPOKOJNA GŁOWA.”** Teraz zwykłe zdanie w Supreme 600 (`.hero__tag`), bez wersalików i trackingu.
9. ✔ **Logotyp rozstrzelony na `.16em`, „WROCŁAW” na `.38em`.** Teraz WARSZTAT w Tanker (`.03em`), a miasto w mono na `.12em`.
10. ✔ **Podpis skanera: mono, wersaliki, tracking i ozdobna kreska przed tekstem** (`.scan-hint__line`). Teraz zwykły podpis 14 px, kreska usunięta.
11. ◐ **Kursywa na jedno słowo, serif-accent, pill badge nad H1.** Sprawdzone, nie występowały.

## Kształty, cienie, powierzchnie
12. ✔ **Jednakowe zaokrąglenie 6–8 px wszędzie** (przyciski, pola, chipy, panele, zdjęcie, mapa, dock). Teraz dwa świadome promienie: `--r-ctl: 2px` dla kontrolek i `--r-panel: 6px` tylko dla formularza, panelu skanera i docka. Zdjęcie i mapa mają ostre rogi.
13. ✔ **Pill 999px na tematach formularza** (`.topic span`), jedyne takie w projekcie. Teraz kafelki 2 px.
14. ✔ **Duży „pływający” cień formularza** (`0 30px 60px`). Usunięty, bo na ciemnym tle karta i tak się odcina.
15. ✔ **Cienie: panel skanera, menu mobilne, dock.** Zastąpione linią 1 px (`#C9C9C2` albo tusz).
16. ✔ **Soczewka „glass”: poświata inset + miękki drop-shadow** (`.lens`). Teraz ostry pierścień 1,5 px z ciemnym obrysem 1 px i ticki jak w celowniku przyrządu.
17. ✔ **Hotspoty z halo** (`box-shadow 4–6px rgba(orange,.22)`), czyli „pulsująca kropka”. Teraz kropka 12 px w białym i grafitowym pierścieniu.
18. ✔ **Półprzezroczyste tła = mini-glassmorphism** (`.hs__label` .92, dock .96, karty opinii .35). Zastąpione pełnym `--bg` / `--surface`.
19. ✔ **Podkreślenie linku zrobione gradientem** (`.btn--text`). Teraz prawdziwe `text-decoration`.
20. ◐ **Gradient w sekcji formularza** (`.book__bg::after`). Zostaje jako scrim, bo trzyma kontrast tekstu na zdjęciu. Uproszczony z 4 do 2 stopów, bez „świetlnego” środka.

## Ikony i strzałki
21. ✔ **↗ przy 12 CTA** (nagłówek, hero, panel, 5 × usługi, submit, mapa, dock). ↗ oznacza teraz tylko wyjście ze strony („Wyznacz trasę”). Hero CTA ma → z przesunięciem 3 px, a reszta to czysty tekst lub podkreślony link (`.link-u`). Odstępstwo od literalnego „↗” w briefie jest celowe.
22. ✔ **Generyczne ikony zasad** (dokument, dymek czatu, tarcza z ptaszkiem). Narysowane od nowa pod warsztat: kosztorys z pozycjami i sumą, telefon z sygnałem, checkbox zgody z podpisem. Kreska 1,5, ścięte narożniki, wyrównanie do lewej zamiast centrowania.
23. ✔ **Kontakt jako lista ikon Feather** (pinezka, dokument, słuchawka, zegar). Teraz tabela `<dl>`: etykieta mono i wartość, linie jak w karcie zlecenia.
24. ✔ **Dwie jednakowe karty opinii z ikoną dymka** (dashed, cień tła). Teraz dwa wiersze-miejsca na przerywanych liniach, z polami `[podpis] · [źródło opinii]` zgodnie z briefem (cytat, podpis, źródło).
25. ✔ **Strzałka → w każdym wierszu usług obracana do ↑** (myląca). Teraz ten sam chevron co w FAQ, obrót 180°.
26. ✔ **Badge „!” w kółku przy błędzie pola.** Zostaje sam tekst błędu plus czerwone obramowanie pola.

## Układ i rytm
27. ✔ **Jeden odstęp dla wszystkich sekcji** (`--section` wszędzie, z border-top). Teraz trzy stopnie: `--sp-l` dla procesu, „O nas” i końca kontaktu, `--sp-m` dla usług i FAQ, `--sp-s` dla krótkich opinii.
28. ✔ **Trzy równoległe numeracje 01…** (sekcje, kroki, usługi 01–05, panel 01). Usunięte numery usług, których nie ma w briefie. Kroki mają numer w małym mono zamiast dużych pomarańczowych cyfr.
29. ✔ **Pasek zasad: trzy wycentrowane kolumny ikona + tekst** (wzorzec „3 features”). Teraz wyrównanie do kolumn siatki, bez centrowania.
30. ✔ **Hover w nawigacji: kreska rosnąca od lewej** (`scaleX`). Teraz zwykłe podkreślenie w akcencie.
31. ✔ **Fade-up także na krokach i opiniach.** Zostały tylko zasady i „O nas”, czyli to, co dopuszcza brief (etapy mają stać nieruchomo).
32. ◐ **Mapa: dekoracyjne „parki” jako bloby.** Bloby usunięte. Ulice zostają, bo mapa jest wyraźnie opisana jako „Mapa poglądowa”, co brief dopuszcza.

## Mikro-copy
33. ✔ **„Poznaj warsztat”** (sztampowe „Poznaj”). Teraz „Zobacz, kto naprawia”, link do sekcji O nas.
34. ✔ **„Pewność przy każdym zatrzymaniu.”** (pusty slogan w panelu skanera). Teraz „Tarcze, klocki, zaciski i płyn. Najpierw mierzymy zużycie.” (`index.html` i `main.js`).
35. ◐ Pozostałe teksty pochodzą z briefu i są konkretne („Coś stuka? Znajdziemy co.”). Nie znalazłem „Odkryj”, „Transform” ani „Twój partner”.
