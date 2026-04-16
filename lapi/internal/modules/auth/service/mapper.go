package service

import (
	authdomain "github.com/thekrauss/lepapillon/internal/modules/auth/domain"
)

func ToProfileResponse(user *authdomain.User, addresses []authdomain.Address) ProfileResponse {
	addrResp := make([]AddressResponse, 0, len(addresses))
	for _, a := range addresses {
		addrResp = append(addrResp, ToAddressResponse(&a))
	}
	return ProfileResponse{
		ID:        user.ID,
		Email:     user.Email,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		Phone:     user.Phone,
		Role:      user.Role,
		Addresses: addrResp,
	}
}

func ToAddressResponse(a *authdomain.Address) AddressResponse {
	return AddressResponse{
		ID:         a.ID,
		Label:      a.Label,
		Street:     a.Street,
		City:       a.City,
		PostalCode: a.PostalCode,
		IsDefault:  a.IsDefault,
	}
}
