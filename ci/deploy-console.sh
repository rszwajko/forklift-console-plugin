#!/usr/bin/env bash

set -euo pipefail
script_dir=$(dirname "$0")

K8S_TIMEOUT=${K8S_TIMEOUT:="360s"}
OKD_CONSOLE_YAML=${OKD_CONSOLE_YAML:="${script_dir}/yaml/okd-console-tls.yaml"}

FORKLIFT_PLUGIN_UPSTREAM_IMG=localhost:5001/forklift-console-plugin:release-v2.5.1
FORKLIFT_PLUGIN_IMAGE=${FORKLIFT_PLUGIN_IMAGE:="localhost:5001/forklift-console-plugin:release-v2.5.1"}

# Install OKD console
# -------------------
echo ""
echo "Starting OKD console"
echo "===================="

echo ""
echo "deploy console CRDs"

kubectl apply -f ${script_dir}/yaml/crds/console

echo ""
echo "deploy OKD console"

cat ${OKD_CONSOLE_YAML} | \
    sed "s/${FORKLIFT_PLUGIN_UPSTREAM_IMG//\//\\/}/${FORKLIFT_PLUGIN_IMAGE//\//\\/}/g" | \
    kubectl apply -f -

#echo ""
#echo "waiting for OKD console service..."
#echo "=================================="

#kubectl wait deployment -n konveyor-forklift console --for condition=Available=True --timeout=${K8S_TIMEOUT}

#echo ""
#echo "waiting for forklift console plugin service..."
#echo "========================================="

#image=$(kubectl get deployment -n konveyor-forklift forklift-console-plugin -o jsonpath={$.spec.template.spec.containers[].image})
#echo ""
#echo "Using: ${image}"

#kubectl wait deployment -n konveyor-forklift forklift-console-plugin --for condition=Available=True --timeout=${K8S_TIMEOUT}
