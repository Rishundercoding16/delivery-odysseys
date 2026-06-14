package com.delivery.models;

public class Edge {

    private LocationNode destination;
    private double distance;

    public Edge(LocationNode destination, double distance) {
        this.destination = destination;
        this.distance = distance;
    }

    public LocationNode getDestination() {
        return destination;
    }

    public double getDistance() {
        return distance;
    }
}