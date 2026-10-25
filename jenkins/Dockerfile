FROM jenkins/jenkins:lts-jdk21

USER root

RUN apt-get update \
  && apt-get install -y --no-install-recommends nodejs npm docker-cli docker-compose curl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL -o /usr/local/bin/kind https://kind.sigs.k8s.io/dl/v0.33.0/kind-linux-amd64 \
  && curl -fsSL -o /tmp/kind.sha256sum https://kind.sigs.k8s.io/dl/v0.33.0/kind-linux-amd64.sha256sum \
  && echo "$(cut -d ' ' -f 1 /tmp/kind.sha256sum)  /usr/local/bin/kind" | sha256sum -c - \
  && curl -fsSL -o /usr/local/bin/kubectl https://dl.k8s.io/release/v1.37.0/bin/linux/amd64/kubectl \
  && curl -fsSL -o /tmp/kubectl.sha256 https://dl.k8s.io/release/v1.37.0/bin/linux/amd64/kubectl.sha256 \
  && echo "$(cat /tmp/kubectl.sha256)  /usr/local/bin/kubectl" | sha256sum -c - \
  && chmod +x /usr/local/bin/kind /usr/local/bin/kubectl \
  && rm /tmp/kind.sha256sum /tmp/kubectl.sha256

COPY plugins.txt /usr/share/jenkins/ref/plugins.txt

USER jenkins
RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt

USER root
