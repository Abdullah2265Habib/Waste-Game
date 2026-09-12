'use strict';

/**
 * Cooperative Levels for 2-Player Co-Op Fate Runner.
 * Legend:
 *  @ : Player 1 Start (Cyan/Blue)
 *  % : Player 2 Start (Bright Orange)
 *  o : Coin
 *  x : Wall
 *  ! : Stationary Lava
 *  = : Horizontal Moving Lava
 *  | : Vertical Moving Lava
 *  v : Dripping Lava
 *  s : Spring
 *  e : Enemy (Bouncing)
 *  t : Tracking Enemy
 *  T : Turret (Fast bullet shooter)
 *  C : Cannon (Cannonball shooter)
 *  H : Horizontal Laser
 *  V : Vertical Laser
 *  L, l : Ladder
 *  i, I, S : Shield
 */

export const LEVELS_COOP = [
  // LEVEL 1: "Dual Origins" - Introduction to 2-player co-op with split starting paths and shared coin goals
  [
    '                                                                                                              ',
    '  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  ',
    '  x                                                                                                        x  ',
    '  x  @     i                 o       o       o                       o       o       o                     x  ',
    '  xxxxxxx                  xxxxx   xxxxx   xxxxx                   xxxxx   xxxxx   xxxxx                   x  ',
    '  x  L  x                                                                                                  x  ',
    '  x  L  x            s                               s               s                                     x  ',
    '  x  L  x          xxxx                            xxxx            xxxx                                    x  ',
    '  x  L  x                                                                                                  x  ',
    '  x  L  xxxxxxxxxxxx                                                                                       x  ',
    '  x                x                        e                 e                 C                 e        x  ',
    '  x                x        e             xxxxx             xxxxx             xxxxx             xxxxx      x  ',
    '  x                xxxxxxxxxxxxxxxxxxxx                                                   xxxxxxxxxx       x  ',
    '  x                                                                                                x       x  ',
    '  x  %     i                                                                                       x       x  ',
    '  xxxxxxx                                                                                          x       x  ',
    '  x  l  x                         v               v               v                                x       x  ',
    '  x  l  x                  xxxxxxxxxxxxxx   xxxxxxxxxxxxxx  xxxxxxxxxxxxxx                         x       x  ',
    '  x  l  x                  x            x   x            x  x            x                         x       x  ',
    '  x  l  x                  x   o    o   x   x   o    o   x  x   o    o   x                         x       x  ',
    '  x  l  x                  xxxxxxxxxxxxxx   xxxxxxxxxxxxxx  xxxxxxxxxxxxxx                         x       x  ',
    '  x  l  xxxxxxxxxxxx                                                                               x       x  ',
    '  x                x                                                                               x       x  ',
    '  x                x                                                     s                         x       x  ',
    '  x                x         xx============xx                          xxxxx                       x       x  ',
    '  x                x                                                                               x       x  ',
    '  x                x    xx                                                                         x       x  ',
    '  x                x                                           o    se o       o                   x       x  ',
    '  x                xxxxxxxxxxxxxxxxxxxxx                   xxxxxxxxxxxxxxxxxxxxxxxxx               x       x  ',
    '  x                                    x                   x                       x               x       x  ',
    '  x                                    x|||||||||||||||||||x                       x               x       x  ',
    '  x                                    x                   x                       x               x       x  ',
    '  x                                    x                   x                       x  T    s     o x       x  ',
    '  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx!xxxxxxxxxxxxxxxxxxx!xxxxxxxxxxxxxxxxxxxxxxx!xxxxxxxxxxxxxxx!xxxxxxxxx  ',
    '                                                                                                              '
  ],

  // LEVEL 2: "Crossfire Canyon" - Laser beams, high cannons, and collaborative platforming
  [
    '                                                                                                              ',
    '  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  ',
    '  x                                                                                                        x  ',
    '  x  @                                                      o     o     o                     C            x  ',
    '  xxxxxxxx            o    o    o                         xxxxxxxxxxxxxxxxx                 xxxxx          x  ',
    '  x                 xxxxxxxxxxxxxxxxx                                                                      x  ',
    '  x                                           H                                                    H       x  ',
    '  x                                                                                                        x  ',
    '  x         s                                                                                              x  ',
    '  x       xxxxx                   C                      e                     T                           x  ',
    '  x                             xxxxx                  xxxxx                 xxxxx                         x  ',
    '  x                                                                                                        x  ',
    '  x  %                                                                                                     x  ',
    '  xxxxxxxx            i                                     s                       s             i        x  ',
    '  x                 xxxxx                                 xxxxx                   xxxxx         xxxxx      x  ',
    '  x                                                                                                        x  ',
    '  x                                           V                                                            x  ',
    '  x                                                                                                        x  ',
    '  x         L                     L                     L                     L                     L      x  ',
    '  x         L                     L                     L                     L                     L      x  ',
    '  x         L    o    o           L    o    o           L    o    o           L    o    o           L      x  ',
    '  x   xxxxxxxxxxxxxxxxxx    xxxxxxxxxxxxxxxxxx    xxxxxxxxxxxxxxxxxx    xxxxxxxxxxxxxxxxxx    xxxxxxx      x  ',
    '  x   x                x    x                x    x                x    x                x    x     x      x  ',
    '  x   x       =        x    x       =        x    x       =        x    x       =        x    x     x      x  ',
    '  x   xxxxxxxxxxxxxxxxxx    xxxxxxxxxxxxxxxxxx    xxxxxxxxxxxxxxxxxx    xxxxxxxxxxxxxxxxxx    x     x      x  ',
    '  x                                                                                                 x      x  ',
    '  x         s                     s                     s                     s                 t   x      x  ',
    '  x       xxxxx                 xxxxx                 xxxxx                 xxxxx             xxxxxxx      x  ',
    '  x                                                                                                        x  ',
    '  x                                                                                        o    o          x  ',
    '  x                                                                                      xxxxxxxxxxxx      x  ',
    '  x                                                                                                        x  ',
    '  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  ',
    '                                                                                                              '
  ],

  // LEVEL 3: "Synchronized Ascend" - Vertical laser traps, moving enemies, and combined vaulting
  [
    '                                                                                                              ',
    '  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  ',
    '  x                                                                                                        x  ',
    '  x                                         o      o      o      o      o                                  x  ',
    '  x                                     xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx                               x  ',
    '  x                                                                                                        x  ',
    '  x                    T                                                       T                           x  ',
    '  x                 xxxxxxx                                                 xxxxxxx                        x  ',
    '  x                                                                                                        x  ',
    '  x        H                                                                               H               x  ',
    '  x                                           s                   s                                        x  ',
    '  x                                        xxxxxxx             xxxxxxx                                     x  ',
    '  x                                                                                                        x  ',
    '  x                                   t                                     t                              x  ',
    '  x                                xxxxxxx                               xxxxxxx                           x  ',
    '  x                                                                                                        x  ',
    '  x             C                                                                               C          x  ',
    '  x          xxxxxxx                                                                         xxxxxxx       x  ',
    '  x                                                                                                        x  ',
    '  x     @                 L                       o       o                       L                 %      x  ',
    '  xxxxxxxxxx              L                    xxxxxxxxxxxxxxx                    L              xxxxxxxxxxx  ',
    '  x        x              L                                                       L              x         x  ',
    '  x   i    x              L                                                       L              x    i    x  ',
    '  xxxxxxxxxx              L                                                       L              xxxxxxxxxxx  ',
    '  x                       L                                                       L                        x  ',
    '  x           s           L             e                           e             L           s            x  ',
    '  x         xxxxx         L          xxxxxxx                     xxxxxxx          L         xxxxx          x  ',
    '  x                       L                                                       L                        x  ',
    '  x                       xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx                        x  ',
    '  x                                              x         x                                               x  ',
    '  x                                              x|||||||||x                                               x  ',
    '  x                                              x         x                                               x  ',
    '  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx!xxxxxxxxx!xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  ',
    '                                                                                                              '
  ],

  // LEVEL 4: "The Inferno Gauntlet" - Supreme Co-Op Trial with precision jump paths, shields, and cannons
  [
    '                                                                                                              ',
    '  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  ',
    '  x                                                                                                        x  ',
    '  x  @  i                                                                                               i  x  ',
    '  xxxxxxxx                                           o     o     o                                      %  x  ',
    '  x                                                xxxxxxxxxxxxxxxxx                                xxxxxxxx  ',
    '  x                                                                                                        x  ',
    '  x        H                                                                                       H       x  ',
    '  x                                                 C             C                                        x  ',
    '  x                                              xxxxxxx       xxxxxxx                                     x  ',
    '  x                     s                                                              s                   x  ',
    '  x                  xxxxxxx                                                        xxxxxxx                x  ',
    '  x                                                                                                        x  ',
    '  x                                                     v     v                                            x  ',
    '  x                                                 xxxxxxxxxxxxx                                          x  ',
    '  x                                                                                                        x  ',
    '  x        T                                                                                       T       x  ',
    '  x     xxxxxxx                                                                                 xxxxxxx    x  ',
    '  x                                                                                                        x  ',
    '  x               s                                      o                                 s               x  ',
    '  x            xxxxxxx                                xxxxxxx                           xxxxxxx            x  ',
    '  x                                                                                                        x  ',
    '  x                                                      o                                                 x  ',
    '  x                                                   xxxxxxx                                              x  ',
    '  x                                                                                                        x  ',
    '  x         L                     L                                           L                     L      x  ',
    '  x         L                     L                     o                     L                     L      x  ',
    '  x         L                     L                  xxxxxxx                  L                     L      x  ',
    '  x    xxxxxxxxxx             xxxxxxxxxx                                  xxxxxxxxxx           xxxxxxxxxx  x  ',
    '  x    x        x             x        x                                  x        x           x        x  x  ',
    '  x    x   ==   x             x   ==   x            x============x        x   ==   x           x   ==   x  x  ',
    '  x    xxxxxxxxxx             xxxxxxxxxx            xxxxxxxxxxxxxx        xxxxxxxxxx           xxxxxxxxxx  x  ',
    '  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  ',
    '                                                                                                              '
  ]
];
