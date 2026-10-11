package com.hospital.hospitalmanagement.dto;

import javax.validation.constraints.NotBlank;

public class RoomDTO {

    private Long roomId;

    @NotBlank(message = "Room number is required")
    private String roomNumber;

    private String roomType;
    private String ward;

    public RoomDTO() {
    }

    public RoomDTO(Long roomId, String roomNumber, String roomType, String ward) {
        this.roomId = roomId;
        this.roomNumber = roomNumber;
        this.roomType = roomType;
        this.ward = ward;
    }

    public Long getRoomId() {
        return roomId;
    }

    public void setRoomId(Long roomId) {
        this.roomId = roomId;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }

    public String getRoomType() {
        return roomType;
    }

    public void setRoomType(String roomType) {
        this.roomType = roomType;
    }

    public String getWard() {
        return ward;
    }

    public void setWard(String ward) {
        this.ward = ward;
    }
}
