package com.hospital.hospitalmanagement.service;

import com.hospital.hospitalmanagement.dto.RoomDTO;
import com.hospital.hospitalmanagement.entity.Room;
import com.hospital.hospitalmanagement.exception.BadRequestException;
import com.hospital.hospitalmanagement.exception.ResourceNotFoundException;
import com.hospital.hospitalmanagement.repository.RoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RoomService {

    private final RoomRepository roomRepository;
    private final IdAllocationService idAllocationService;

    public RoomService(RoomRepository roomRepository, IdAllocationService idAllocationService) {
        this.roomRepository = roomRepository;
        this.idAllocationService = idAllocationService;
    }

    public List<RoomDTO> getAllRooms() {
        return roomRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public RoomDTO getRoomById(Long id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with ID: " + id));
        return convertToDTO(room);
    }

    @Transactional
    public RoomDTO createRoom(RoomDTO dto) {
        if (roomRepository.existsByRoomNumber(dto.getRoomNumber())) {
            throw new BadRequestException("Room with number '" + dto.getRoomNumber() + "' already exists");
        }

        Long assignedId;
        if (dto.getRoomId() != null) {
            if (dto.getRoomId() <= 0) {
                throw new BadRequestException("Room ID must be greater than zero");
            }
            if (roomRepository.existsById(dto.getRoomId())) {
                throw new BadRequestException("Room with ID " + dto.getRoomId() + " already exists");
            }
            assignedId = dto.getRoomId();
            idAllocationService.recordCustomId("Room", assignedId);
        } else {
            assignedId = idAllocationService.allocateNextId("Room", "roomId");
        }

        Room room = new Room();
        room.setRoomId(assignedId);
        room.setRoomNumber(dto.getRoomNumber());
        room.setRoomType(dto.getRoomType());
        room.setWard(dto.getWard());

        Room saved = roomRepository.save(room);
        return convertToDTO(saved);
    }

    @Transactional
    public RoomDTO updateRoom(Long id, RoomDTO dto) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with ID: " + id));

        if (roomRepository.existsByRoomNumberAndRoomIdNot(dto.getRoomNumber(), id)) {
            throw new BadRequestException("Room with number '" + dto.getRoomNumber() + "' already exists");
        }

        room.setRoomNumber(dto.getRoomNumber());
        room.setRoomType(dto.getRoomType());
        room.setWard(dto.getWard());

        Room updated = roomRepository.save(room);
        return convertToDTO(updated);
    }

    @Transactional
    public void deleteRoom(Long id) {
        if (!roomRepository.existsById(id)) {
            throw new ResourceNotFoundException("Room not found with ID: " + id);
        }
        roomRepository.deleteById(id);
    }

    public RoomDTO convertToDTO(Room room) {
        return new RoomDTO(
                room.getRoomId(),
                room.getRoomNumber(),
                room.getRoomType(),
                room.getWard()
        );
    }
}
