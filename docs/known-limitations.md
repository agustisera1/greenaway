# Limitaciones conocidas

- **No leídos del rail de Messages:** el número de cada chat se actualiza al navegar o refrescar. El
  aviso en vivo de un mensaje nuevo no dice de qué chat es, así que en vivo solo sube el badge del
  sidebar.
- **Conteo de no leídos:** se calcula al leer, recorriendo los mensajes posteriores al cursor de cada
  chat, y el badge del sidebar lo pide en cada navegación. Además, cada mensaje que llega con un chat
  abierto revalida todo `/messages`. A escala, el número iría guardado en el cursor: el worker le suma
  1 con cada mensaje y abrir el chat lo pone en 0.
- **Signup con Redis caído:** la cota por IP del signup falla cerrada, así que sin Redis nadie puede
  registrarse. La salida sin perder el freno: crear la cuenta igual, pero inactiva y anotada para
  revisión, con un estado `active`/`inactive` en `users` que alguien activa a mano después de mirarla.
