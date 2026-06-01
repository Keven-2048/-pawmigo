package service

import (
	"github.com/pawmigo/server/internal/middleware"
	"github.com/pawmigo/server/internal/model"
	"github.com/pawmigo/server/internal/repository"
	"github.com/pawmigo/server/internal/wxauth"
)

type LoginOutput struct {
	Token string      `json:"token"`
	User  *model.User `json:"user"`
}

type AuthService struct {
	wx       wxauth.Client
	userRepo *repository.UserRepo
	jwt      *middleware.JWT
}

func NewAuthService(wx wxauth.Client, ur *repository.UserRepo, j *middleware.JWT) *AuthService {
	return &AuthService{wx: wx, userRepo: ur, jwt: j}
}

func (s *AuthService) Login(code string) (*LoginOutput, error) {
	sess, err := s.wx.Code2Session(code)
	if err != nil {
		return nil, err
	}
	user, err := s.userRepo.FindOrCreateByOpenID(sess.OpenID)
	if err != nil {
		return nil, err
	}
	token, err := s.jwt.Sign(user.ID)
	if err != nil {
		return nil, err
	}
	return &LoginOutput{Token: token, User: user}, nil
}
