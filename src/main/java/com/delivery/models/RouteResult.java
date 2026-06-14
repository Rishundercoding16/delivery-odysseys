package com.delivery.models;

import java.util.List;
import java.util.Map;

public class RouteResult {

    private Map<LocationNode, Double> distances;
    private Map<LocationNode, LocationNode> previousNodes;

    public RouteResult(
            Map<LocationNode, Double> distances,
            Map<LocationNode, LocationNode> previousNodes
    ) {
        this.distances = distances;
        this.previousNodes = previousNodes;
    }

    public Map<LocationNode, Double> getDistances() {
        return distances;
    }

    public Map<LocationNode, LocationNode> getPreviousNodes() {
        return previousNodes;
    }

    public List<LocationNode> buildPath(LocationNode target) {

        List<LocationNode> path =
                new java.util.ArrayList<>();

        LocationNode current = target;

        while (current != null) {
            path.add(0, current);
            current = previousNodes.get(current);
        }

        return path;
    }
}