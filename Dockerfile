FROM denoland/deno

WORKDIR /action

COPY . .

RUN deno install src/index.ts

ENTRYPOINT ["deno", "run", "--allow-env", "--allow-read", "--allow-net", "./src/index.ts"]
