import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { favoriteDoctorService, FavoriteDoctor } from '../services/favorite-doctor.service';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { UserIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

export const FavoriteDoctors: React.FC = () => {
  const [favorites, setFavorites] = useState<FavoriteDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const response = await favoriteDoctorService.getAll();
      setFavorites(response.data || []);
    } catch (err: any) {
      console.error('Error loading favorites:', err);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const handleRemoveFavorite = async (doctorId: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa bác sĩ này khỏi danh sách yêu thích?')) {
      return;
    }

    try {
      await favoriteDoctorService.remove(doctorId);
      await loadFavorites();
    } catch (err: any) {
      alert('Xóa thất bại: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleBookAppointment = (doctorId: number) => {
    navigate(`/book-appointment?doctorId=${doctorId}`);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-neutral-dark">Bác sĩ yêu thích</h1>
            <p className="text-neutral-medium mt-2">Quản lý danh sách bác sĩ yêu thích của bạn</p>
          </div>
          <Link to="/book-appointment">
            <Button variant="primary">Đặt lịch mới</Button>
          </Link>
        </div>

        {/* Favorites List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-neutral-medium">Đang tải...</p>
          </div>
        ) : favorites.length === 0 ? (
          <Card className="text-center py-12">
            <HeartIcon className="w-16 h-16 text-neutral-medium mx-auto mb-4" />
            <p className="text-neutral-medium text-lg mb-2">Chưa có bác sĩ yêu thích nào</p>
            <p className="text-neutral-medium mb-4">
              Thêm bác sĩ yêu thích để dễ dàng đặt lịch khám lại
            </p>
            <Link to="/book-appointment">
              <Button variant="primary">Tìm bác sĩ</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((favorite) => {
              const doctor = favorite.doctor;
              if (!doctor) return null;

              return (
                <Card key={favorite.id} className="hover:shadow-lg transition-shadow">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative w-24 h-24 rounded-full bg-primary-50 flex items-center justify-center mb-4 border-4 border-primary-100">
                      {doctor.avatar ? (
                        <img
                          src={doctor.avatar}
                          alt={doctor.fullName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <UserIcon className="w-12 h-12 text-primary-500" />
                      )}
                    </div>

                    <h3 className="text-xl font-semibold text-neutral-dark mb-1">
                      {doctor.fullName}
                    </h3>
                    <p className="text-sm text-primary-500 font-medium mb-2">
                      {doctor.speciality}
                    </p>
                    {doctor.experienceYears && (
                      <p className="text-xs text-neutral-medium mb-4">
                        {doctor.experienceYears} năm kinh nghiệm
                      </p>
                    )}

                    <div className="flex gap-2 w-full mt-4">
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleBookAppointment(doctor.id)}
                      >
                        Đặt lịch
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFavorite(doctor.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <HeartIconSolid className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};


